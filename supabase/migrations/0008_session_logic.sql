-- ECoLearn - how a session actually happens, and the appointment lifecycle.
-- Run after 0001-0007.
--
-- Before this migration a booking only said "a student has a slot". Nothing
-- told the two people HOW to meet, and the tutor had no way to confirm,
-- finish or cancel an appointment. This migration adds:
--
--   1. Session details per availability window: online (meeting link) or
--      in person (location). They are copied onto each appointment when it is
--      booked, so a later change never breaks an existing booking.
--   2. The appointment lifecycle: scheduled -> confirmed -> completed, plus
--      no_show and cancelled, each through its own function.
--   3. Guard rails: no overlapping bookings for a student, no changes to a
--      session that already started, and friendly errors instead of raw
--      foreign-key failures when a window still has appointments.
--   4. Admin review can only decide applications that are waiting for review.

-- ============================================================================
-- 1. SESSION DETAILS
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'session_mode'
  ) then
    create type public.session_mode as enum ('online', 'in_person');
  end if;
end
$$;

alter table availability
  add column if not exists session_mode public.session_mode not null default 'online',
  add column if not exists meeting_url  text,
  add column if not exists location     text;

-- NOT VALID: windows created before this migration have no link yet. The rule
-- applies to every new or changed row; the app shows "link not shared yet" for
-- the old ones.
alter table availability
  add constraint availability_session_details_check
    check (
      (session_mode = 'online'    and meeting_url is not null and location is null)
      or
      (session_mode = 'in_person' and location is not null and meeting_url is null)
    ) not valid,
  add constraint availability_meeting_url_check
    check (meeting_url is null or (meeting_url ~* '^https://[^[:space:]]+$' and char_length(meeting_url) <= 500)),
  add constraint availability_location_check
    check (location is null or (char_length(trim(location)) between 3 and 200));

-- Public: a student may see HOW a slot is held (online / in person) before
-- booking, but never the link itself (that stays on `availability`, which only
-- the tutor and admins can read).
alter table appointment_slots
  add column if not exists session_mode public.session_mode not null default 'online';

-- Snapshot taken at booking time; visible only to the student, the tutor and
-- admins through the existing appointments policies.
alter table appointments
  add column if not exists session_mode public.session_mode not null default 'online',
  add column if not exists meeting_url  text,
  add column if not exists location     text,
  add column if not exists confirmed_at timestamptz;

create or replace function public.generate_appointment_slots(p_availability_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a availability%rowtype;
  v_cursor time;
  v_step interval;
begin
  select * into a from availability where id = p_availability_id;
  if not found then
    return;
  end if;

  delete from appointment_slots
  where availability_id = p_availability_id and status = 'open';

  v_step := make_interval(mins => a.slot_duration_minutes);
  v_cursor := a.start_time;
  while v_cursor + v_step <= a.end_time loop
    insert into appointment_slots (
      availability_id, tutor_profile_id, subject_id, slot_date, start_time, end_time, session_mode
    ) values (
      a.id, a.tutor_profile_id, a.subject_id, a.day_date, v_cursor, v_cursor + v_step, a.session_mode
    )
    on conflict (tutor_profile_id, slot_date, start_time) do nothing;
    v_cursor := v_cursor + v_step;
  end loop;
end;
$$;

-- The window's time or session type changed: rebuild the open slots. A window
-- that already has a booked slot cannot be reshaped.
create or replace function public.availability_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from appointment_slots
    where availability_id = new.id and status = 'booked'
  ) then
    raise exception 'This availability window has active bookings and cannot be reshaped. Cancel the affected appointments first.';
  end if;
  perform public.generate_appointment_slots(new.id);
  return new;
end;
$$;

drop trigger availability_regenerate_slots on availability;
create trigger availability_regenerate_slots
  after update of start_time, end_time, slot_duration_minutes, session_mode on availability
  for each row execute function public.availability_after_update();

-- ============================================================================
-- 2. AVAILABILITY GUARD RAILS
-- ============================================================================

-- New windows must start in the future (Philippine time). auth.uid() is null
-- for migrations, the seed script and the service role, so those are not
-- affected.
create function public.availability_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and public.slot_starts_at(new.day_date, new.start_time) <= now() then
    raise exception 'Choose a date and time in the future.';
  end if;
  return new;
end;
$$;

create trigger availability_check_future
  before insert on availability
  for each row execute function public.availability_before_insert();

-- appointments.slot_id has no ON DELETE action, so deleting a window that
-- still has appointments would end in a raw foreign-key error. Say why instead.
create function public.availability_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from appointments a
    join appointment_slots s on s.id = a.slot_id
    where s.availability_id = old.id and a.status in ('scheduled', 'confirmed')
  ) then
    raise exception 'This window has active appointments. Cancel them first, then remove the window.';
  end if;
  if exists (
    select 1
    from appointments a
    join appointment_slots s on s.id = a.slot_id
    where s.availability_id = old.id
  ) then
    raise exception 'This window has appointment history and cannot be removed.';
  end if;
  return old;
end;
$$;

create trigger availability_guard_delete
  before delete on availability
  for each row execute function public.availability_before_delete();

-- ============================================================================
-- 3. RLS: names stay visible for people you have an appointment with
-- A tutor deactivated by an admin disappears from the directory, but the
-- student's appointment history must still show who the tutor was.
-- ============================================================================

create policy profiles_select_my_tutors on public.profiles for select
  using (
    exists (
      select 1
      from tutor_profiles tp
      join appointments a on a.tutor_profile_id = tp.id
      where tp.profile_id = profiles.id and a.student_id = auth.uid()
    )
  );

create policy tutor_profiles_select_my_tutors on public.tutor_profiles for select
  using (
    exists (
      select 1 from appointments a
      where a.tutor_profile_id = tutor_profiles.id and a.student_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. HELPERS
-- ============================================================================

-- "Fri, October 30, 2026 at 9:00 AM" for notification text.
create function public.format_session_time(p_date date, p_start time)
returns text
language sql
immutable
set search_path = public
as $$
  select to_char(p_date, 'FMDy, FMMonth FMDD, YYYY') || ' at ' || to_char(p_start, 'FMHH12:MI AM');
$$;

create function public.display_name(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(first_name || ' ' || last_name), ''), 'A user')
  from profiles where id = p_profile_id;
$$;

revoke execute on function public.format_session_time(date, time) from public, anon, authenticated;
revoke execute on function public.display_name(uuid) from public, anon, authenticated;

-- ============================================================================
-- 5. BOOKING
-- ============================================================================

create or replace function public.book_appointment_slot(p_slot_id uuid, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot appointment_slots%rowtype;
  v_availability availability%rowtype;
  v_tutor tutor_profiles%rowtype;
  v_appointment_id uuid;
  v_notes text := nullif(trim(p_notes), '');
  v_when text;
begin
  if public.current_profile_role() is distinct from 'student' then
    raise exception 'Only students can book appointments.';
  end if;
  if char_length(v_notes) > 1000 then
    raise exception 'Notes must be 1000 characters or fewer.';
  end if;

  select * into v_slot from appointment_slots where id = p_slot_id for update;
  if not found then
    raise exception 'This appointment slot no longer exists.';
  end if;
  if v_slot.status <> 'open' then
    raise exception 'This slot is no longer available. Please choose another time.';
  end if;
  if public.slot_starts_at(v_slot.slot_date, v_slot.start_time) <= now() then
    raise exception 'This slot has already passed.';
  end if;

  select * into v_tutor from tutor_profiles where id = v_slot.tutor_profile_id;
  if not coalesce(v_tutor.is_active, false) then
    raise exception 'This tutor is not currently accepting bookings.';
  end if;

  if exists (
    select 1
    from appointments a
    join appointment_slots s on s.id = a.slot_id
    where a.student_id = auth.uid()
      and a.status in ('scheduled', 'confirmed')
      and s.slot_date = v_slot.slot_date
      and s.start_time < v_slot.end_time
      and s.end_time > v_slot.start_time
  ) then
    raise exception 'You already have a session at that time.';
  end if;

  select * into v_availability from availability where id = v_slot.availability_id;

  insert into appointments (
    slot_id, student_id, tutor_profile_id, subject_id, status, notes,
    session_mode, meeting_url, location
  ) values (
    v_slot.id, auth.uid(), v_slot.tutor_profile_id, v_slot.subject_id, 'scheduled', v_notes,
    v_slot.session_mode, v_availability.meeting_url, v_availability.location
  )
  returning id into v_appointment_id;

  update appointment_slots set status = 'booked' where id = v_slot.id;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
  values (v_appointment_id, null, 'scheduled', auth.uid());

  perform public.log_audit_event('STUDENT_BOOKED_APPOINTMENT', 'appointment', v_appointment_id,
    jsonb_build_object('slot_id', v_slot.id));

  v_when := public.format_session_time(v_slot.slot_date, v_slot.start_time);
  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values
    (auth.uid(), 'appointment_booked', 'Session requested',
     'Your session with ' || public.display_name(v_tutor.profile_id) || ' on ' || v_when
       || ' is waiting for the tutor to confirm.', 'appointment', v_appointment_id),
    (v_tutor.profile_id, 'new_appointment', 'New session request',
     public.display_name(auth.uid()) || ' booked a session on ' || v_when || '. Please confirm it.',
     'appointment', v_appointment_id);

  return v_appointment_id;
end;
$$;

-- ============================================================================
-- 6. CONFIRM / COMPLETE / NO-SHOW
-- Only the tutor who owns the appointment (or an admin) may move it forward.
-- ============================================================================

create function public.confirm_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_slot appointment_slots%rowtype;
begin
  select * into v_appt from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Appointment not found.';
  end if;
  if not (public.owns_tutor_profile(v_appt.tutor_profile_id) or public.is_admin()) then
    raise exception 'You are not authorized to confirm this appointment.';
  end if;
  if v_appt.status <> 'scheduled' then
    raise exception 'Only a new session request can be confirmed.';
  end if;

  select * into v_slot from appointment_slots where id = v_appt.slot_id;
  if public.slot_starts_at(v_slot.slot_date, v_slot.start_time) <= now() then
    raise exception 'This session has already started and can no longer be confirmed.';
  end if;

  update appointments set status = 'confirmed', confirmed_at = now() where id = v_appt.id;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
  values (v_appt.id, 'scheduled', 'confirmed', auth.uid());

  perform public.log_audit_event('TUTOR_CONFIRMED_APPOINTMENT', 'appointment', v_appt.id, '{}'::jsonb);

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values (v_appt.student_id, 'appointment_confirmed', 'Session confirmed',
          'Your session on ' || public.format_session_time(v_slot.slot_date, v_slot.start_time)
            || ' is confirmed. Open your dashboard to see how to join.',
          'appointment', v_appt.id);
end;
$$;

create function public.complete_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_slot appointment_slots%rowtype;
begin
  select * into v_appt from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Appointment not found.';
  end if;
  if not (public.owns_tutor_profile(v_appt.tutor_profile_id) or public.is_admin()) then
    raise exception 'You are not authorized to complete this appointment.';
  end if;
  if v_appt.status <> 'confirmed' then
    raise exception 'Only a confirmed session can be marked as completed.';
  end if;

  select * into v_slot from appointment_slots where id = v_appt.slot_id;
  if public.slot_starts_at(v_slot.slot_date, v_slot.start_time) > now() then
    raise exception 'This session has not started yet.';
  end if;

  update appointments set status = 'completed' where id = v_appt.id;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
  values (v_appt.id, 'confirmed', 'completed', auth.uid());

  perform public.log_audit_event('TUTOR_COMPLETED_APPOINTMENT', 'appointment', v_appt.id, '{}'::jsonb);

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values (v_appt.student_id, 'appointment_completed', 'Session completed',
          'Your session on ' || public.format_session_time(v_slot.slot_date, v_slot.start_time)
            || ' was marked as completed.', 'appointment', v_appt.id);
end;
$$;

create function public.mark_appointment_no_show(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_slot appointment_slots%rowtype;
begin
  select * into v_appt from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Appointment not found.';
  end if;
  if not (public.owns_tutor_profile(v_appt.tutor_profile_id) or public.is_admin()) then
    raise exception 'You are not authorized to update this appointment.';
  end if;
  if v_appt.status <> 'confirmed' then
    raise exception 'Only a confirmed session can be marked as a no-show.';
  end if;

  select * into v_slot from appointment_slots where id = v_appt.slot_id;
  if public.slot_starts_at(v_slot.slot_date, v_slot.start_time) + interval '15 minutes' > now() then
    raise exception 'Wait at least 15 minutes after the start time before marking a no-show.';
  end if;

  update appointments set status = 'no_show' where id = v_appt.id;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
  values (v_appt.id, 'confirmed', 'no_show', auth.uid());

  perform public.log_audit_event('TUTOR_MARKED_NO_SHOW', 'appointment', v_appt.id, '{}'::jsonb);

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values (v_appt.student_id, 'appointment_no_show', 'Session marked as missed',
          'You were marked as absent for your session on '
            || public.format_session_time(v_slot.slot_date, v_slot.start_time) || '.',
          'appointment', v_appt.id);
end;
$$;

-- ============================================================================
-- 7. CANCELLATION
-- Student: at least 2 hours before the start. Tutor or admin: any time before
-- the start, with a reason (the student is told why). Nobody can cancel a
-- session that already started. A student's cancellation reopens the slot; a
-- tutor's or admin's does not (the tutor said they cannot teach then).
-- ============================================================================

create or replace function public.cancel_appointment(p_appointment_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_slot appointment_slots%rowtype;
  v_tutor_profile_id uuid;
  v_starts_at timestamptz;
  v_reason text := nullif(trim(p_reason), '');
  v_by_student boolean;
  v_action text;
  v_when text;
  v_who text;
begin
  if char_length(v_reason) > 500 then
    raise exception 'The reason must be 500 characters or fewer.';
  end if;

  select * into v_appt from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Appointment not found.';
  end if;
  if v_appt.status not in ('scheduled', 'confirmed') then
    raise exception 'This appointment can no longer be cancelled.';
  end if;

  v_by_student := v_appt.student_id = auth.uid();
  if not (v_by_student or public.owns_tutor_profile(v_appt.tutor_profile_id) or public.is_admin()) then
    raise exception 'You are not authorized to cancel this appointment.';
  end if;

  select * into v_slot from appointment_slots where id = v_appt.slot_id for update;
  v_starts_at := public.slot_starts_at(v_slot.slot_date, v_slot.start_time);

  if v_starts_at <= now() then
    raise exception 'This session has already started and can no longer be cancelled.';
  end if;

  if v_by_student then
    if v_starts_at - now() < interval '2 hours' then
      raise exception 'Appointments can only be cancelled at least 2 hours before the scheduled time.';
    end if;
    v_action := 'STUDENT_CANCELLED_APPOINTMENT';
  else
    if v_reason is null then
      raise exception 'Please give a reason so the student knows why the session was cancelled.';
    end if;
    v_action := case when public.is_admin() then 'ADMIN_CANCELLED_APPOINTMENT' else 'TUTOR_CANCELLED_APPOINTMENT' end;
  end if;

  update appointments
    set status = 'cancelled', cancelled_by = auth.uid(), cancellation_reason = v_reason
    where id = p_appointment_id;

  update appointment_slots
    set status = case when v_by_student then 'open'::slot_status else 'cancelled'::slot_status end
    where id = v_slot.id;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by, note)
  values (p_appointment_id, v_appt.status, 'cancelled', auth.uid(), v_reason);

  perform public.log_audit_event(v_action, 'appointment', p_appointment_id,
    jsonb_build_object('reason', v_reason));

  select profile_id into v_tutor_profile_id from tutor_profiles where id = v_appt.tutor_profile_id;
  v_when := public.format_session_time(v_slot.slot_date, v_slot.start_time);
  v_who := case when v_by_student then public.display_name(v_appt.student_id)
                else public.display_name(v_tutor_profile_id) end;

  if v_by_student then
    insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
    values
      (v_appt.student_id, 'appointment_cancelled', 'Session cancelled',
       'You cancelled your session on ' || v_when || '.', 'appointment', p_appointment_id),
      (v_tutor_profile_id, 'appointment_cancelled', 'Session cancelled',
       v_who || ' cancelled the session on ' || v_when || '.'
         || coalesce(' Reason: ' || v_reason, ''), 'appointment', p_appointment_id);
  else
    insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
    values
      (v_appt.student_id, 'appointment_cancelled', 'Session cancelled by the tutor',
       v_who || ' cancelled your session on ' || v_when || '. Reason: ' || v_reason,
       'appointment', p_appointment_id),
      (v_tutor_profile_id, 'appointment_cancelled', 'Session cancelled',
       'The session on ' || v_when || ' was cancelled.', 'appointment', p_appointment_id);
  end if;
end;
$$;

-- ============================================================================
-- 8. TUTOR APPLICATION REVIEW — only applications waiting for a decision
-- A tutor who was asked to revise must resubmit before an admin can approve or
-- reject; previously an admin could decide an application the tutor was still
-- editing. auth.uid() is null for migrations, the seed script and the service
-- role, which are not restricted.
-- ============================================================================

create or replace function public.enforce_application_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    if new.status is distinct from old.status then
      if old.status not in ('pending', 'under_review') then
        raise exception 'This application is not waiting for a decision.';
      end if;
      if new.status not in ('under_review', 'approved', 'rejected', 'needs_revision') then
        raise exception 'That is not a valid review decision.';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    if new.status in ('rejected', 'needs_revision') and coalesce(trim(new.review_notes), '') = '' then
      raise exception 'A reason is required when rejecting an application or requesting revision.';
    end if;
  else
    -- A tutor may only edit their own application while it is editable,
    -- and may only move it forward into 'pending'.
    if old.status not in ('draft', 'needs_revision') then
      raise exception 'This application can no longer be edited.';
    end if;
    if new.status not in (old.status, 'pending') then
      raise exception 'Tutors cannot set an application to that status.';
    end if;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    if new.status = 'pending' and old.status <> 'pending' then
      new.submitted_at := now();
      new.review_notes := null;
    end if;
  end if;
  return new;
end;
$$;

-- ============================================================================
-- 9. FUNCTION PRIVILEGES (same pattern as 0004 / 0005)
-- ============================================================================

revoke execute on function public.book_appointment_slot(uuid, text) from public, anon;
revoke execute on function public.cancel_appointment(uuid, text) from public, anon;
revoke execute on function public.confirm_appointment(uuid) from public, anon;
revoke execute on function public.complete_appointment(uuid) from public, anon;
revoke execute on function public.mark_appointment_no_show(uuid) from public, anon;
revoke execute on function public.availability_before_insert() from public, anon, authenticated;
revoke execute on function public.availability_before_delete() from public, anon, authenticated;

grant execute on function public.book_appointment_slot(uuid, text) to authenticated;
grant execute on function public.cancel_appointment(uuid, text) to authenticated;
grant execute on function public.confirm_appointment(uuid) to authenticated;
grant execute on function public.complete_appointment(uuid) to authenticated;
grant execute on function public.mark_appointment_no_show(uuid) to authenticated;

-- ============================================================================
-- 10. ADMIN: contact details for many people in one call
-- The admin metric pages used to call get_private_profile() once per person.
-- Same rule as before: a person's own details, or any person's for an admin.
-- ============================================================================

create function public.get_private_profiles(p_profile_ids uuid[])
returns table (id uuid, email text, phone text)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.email, p.phone
  from profiles p
  where p.id = any (p_profile_ids)
    and (p.id = auth.uid() or public.is_admin());
$$;

revoke execute on function public.get_private_profiles(uuid[]) from public, anon;
grant execute on function public.get_private_profiles(uuid[]) to authenticated;

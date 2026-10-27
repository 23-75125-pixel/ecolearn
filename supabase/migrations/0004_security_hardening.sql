-- ECoLearn — security hardening
-- Run after 0001-0003. Every change below closes a hole that was reproduced
-- against 0002 with a test user (see docs/SECURITY.md for the list).

-- ============================================================================
-- 1. FUNCTION PRIVILEGES
-- Postgres gives EXECUTE to everyone by default. Only the two booking RPCs and
-- the three RLS helpers need to be callable by API roles; everything else
-- (audit logger, slot generator, trigger functions) is internal.
-- ============================================================================

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.current_profile_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.owns_tutor_profile(uuid) to anon, authenticated;

-- ============================================================================
-- 2. PROFILES — keep contact details private
-- The public-directory policy exposed every column of an active tutor
-- (email, phone, address, date of birth) to anonymous visitors. Sensitive
-- columns are now readable only through get_private_profile().
-- ============================================================================

revoke select on public.profiles from anon, authenticated;
grant select (id, role, first_name, last_name, avatar_url, created_at, updated_at)
  on public.profiles to anon, authenticated;

create function public.get_private_profile(p_profile_id uuid)
returns table (email text, phone text)
language sql
security definer
stable
set search_path = public
as $$
  select p.email, p.phone
  from profiles p
  where p.id = p_profile_id
    and (p.id = auth.uid() or public.is_admin());
$$;

revoke execute on function public.get_private_profile(uuid) from public, anon;
grant execute on function public.get_private_profile(uuid) to authenticated;

-- Tutors must be able to read the names of students who booked with them.
create policy profiles_select_my_students on public.profiles for select
  using (
    exists (
      select 1 from appointments a
      where a.student_id = profiles.id
        and public.owns_tutor_profile(a.tutor_profile_id)
    )
  );

-- ============================================================================
-- 3. TUTOR PROFILES — a tutor can edit headline/bio only
-- Previously a tutor could set is_active = true again after an admin
-- deactivated them.
-- ============================================================================

create function public.guard_tutor_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for migrations, the seed script and the service role.
  if auth.uid() is not null and not public.is_admin() then
    if new.is_active is distinct from old.is_active
       or new.profile_id is distinct from old.profile_id
       or new.application_id is distinct from old.application_id then
      raise exception 'Only an administrator can change these tutor profile fields.';
    end if;
  end if;
  return new;
end;
$$;

create trigger tutor_profiles_guard_privileged_fields
  before update on public.tutor_profiles
  for each row execute function public.guard_tutor_profile_privileged_fields();

-- ============================================================================
-- 4. TUTOR APPLICATIONS — new rows always start as plain drafts
-- Previously a tutor could INSERT a row that was already 'approved'.
-- ============================================================================

drop policy tutor_applications_insert on public.tutor_applications;

create policy tutor_applications_insert on public.tutor_applications for insert
  with check (
    tutor_id = auth.uid()
    and public.current_profile_role() = 'tutor'
    and status = 'draft'
    and review_notes is null
    and reviewed_by is null
    and reviewed_at is null
    and submitted_at is null
  );

-- ============================================================================
-- 5. APPOINTMENTS AND SLOTS — written only by the booking functions
-- The old UPDATE policy let a tutor rewrite student_id, status, or any other
-- column of an appointment; the slot write policy let a tutor invent slots
-- that were never part of an availability window.
-- ============================================================================

drop policy appointments_update on public.appointments;
drop policy appointment_slots_write on public.appointment_slots;

revoke insert, update, delete on public.appointments from anon, authenticated;
revoke insert, update, delete on public.appointment_slots from anon, authenticated;

-- ============================================================================
-- 6. NOTIFICATIONS — a user may only mark their own notifications as read
-- ============================================================================

revoke update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;

-- ============================================================================
-- 7. INPUT LENGTH LIMITS
-- The database is the last line of defence against oversized text.
-- ============================================================================

alter table public.profiles
  add constraint profiles_name_length_check
    check (char_length(first_name) <= 100 and char_length(last_name) <= 100),
  add constraint profiles_phone_length_check
    check (phone is null or char_length(phone) <= 30);

alter table public.tutor_profiles
  add constraint tutor_profiles_headline_length_check
    check (headline is null or char_length(headline) <= 150),
  add constraint tutor_profiles_bio_length_check
    check (bio is null or char_length(bio) <= 2000);

alter table public.tutor_applications
  add constraint tutor_applications_text_length_check
    check (
      coalesce(char_length(school_name), 0) <= 200
      and coalesce(char_length(degree), 0) <= 200
      and coalesce(char_length(major), 0) <= 200
      and coalesce(char_length(academic_achievements), 0) <= 2000
      and coalesce(char_length(teaching_experience_summary), 0) <= 2000
      and coalesce(char_length(teaching_approach), 0) <= 500
      and coalesce(char_length(review_notes), 0) <= 1000
    );

alter table public.appointments
  add constraint appointments_text_length_check
    check (
      coalesce(char_length(notes), 0) <= 1000
      and coalesce(char_length(cancellation_reason), 0) <= 500
    );

alter table public.availability
  add constraint availability_notes_length_check
    check (notes is null or char_length(notes) <= 500);

alter table public.tutor_credentials
  add constraint tutor_credentials_file_size_check
    check (file_size is null or file_size <= 5 * 1024 * 1024);

-- New accounts: trim and cap names taken from signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into profiles (id, role, first_name, last_name, email, phone)
  values (
    new.id,
    case when requested_role in ('student', 'tutor') then requested_role::app_role else 'student' end,
    left(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), 100),
    left(trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')), 100),
    new.email,
    left(trim(new.raw_user_meta_data ->> 'phone'), 30)
  );
  return new;
end;
$$;

-- ============================================================================
-- 8. STORAGE — credentials: 5 MB, PDF/JPG/PNG only (enforced by the bucket)
-- ============================================================================

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
where id = 'tutor-credentials';

-- ============================================================================
-- 9. TIME ZONE — slot times are Philippine local time
-- slot_date + start_time has no zone, so the booking functions treated it as
-- UTC and the "2 hours before" rule was off by 8 hours.
-- ============================================================================

create function public.slot_starts_at(p_date date, p_start time)
returns timestamptz
language sql
immutable
set search_path = public
as $$
  select (p_date + p_start) at time zone 'Asia/Manila';
$$;

revoke execute on function public.slot_starts_at(date, time) from public, anon;
grant execute on function public.slot_starts_at(date, time) to authenticated;

create or replace function public.book_appointment_slot(p_slot_id uuid, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot appointment_slots%rowtype;
  v_tutor_active boolean;
  v_appointment_id uuid;
  v_notes text := nullif(trim(p_notes), '');
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

  select is_active into v_tutor_active from tutor_profiles where id = v_slot.tutor_profile_id;
  if not coalesce(v_tutor_active, false) then
    raise exception 'This tutor is not currently accepting bookings.';
  end if;

  insert into appointments (slot_id, student_id, tutor_profile_id, subject_id, status, notes)
  values (v_slot.id, auth.uid(), v_slot.tutor_profile_id, v_slot.subject_id, 'scheduled', v_notes)
  returning id into v_appointment_id;

  update appointment_slots set status = 'booked' where id = v_slot.id;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by)
  values (v_appointment_id, null, 'scheduled', auth.uid());

  perform public.log_audit_event('STUDENT_BOOKED_APPOINTMENT', 'appointment', v_appointment_id,
    jsonb_build_object('slot_id', v_slot.id));

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values
    (auth.uid(), 'appointment_booked', 'Booking confirmed',
     'Your appointment has been successfully booked.', 'appointment', v_appointment_id),
    ((select profile_id from tutor_profiles where id = v_slot.tutor_profile_id), 'new_appointment',
     'New appointment', 'You have a new appointment.', 'appointment', v_appointment_id);

  return v_appointment_id;
end;
$$;

create or replace function public.cancel_appointment(p_appointment_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_slot appointment_slots%rowtype;
  v_starts_at timestamptz;
  v_reason text := nullif(trim(p_reason), '');
  v_is_student boolean;
  v_is_owning_tutor boolean;
  v_action text;
begin
  if char_length(v_reason) > 500 then
    raise exception 'The reason must be 500 characters or fewer.';
  end if;

  select * into v_appt from appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'Appointment not found.';
  end if;
  if v_appt.status in ('cancelled', 'completed') then
    raise exception 'This appointment can no longer be cancelled.';
  end if;

  v_is_student := v_appt.student_id = auth.uid();
  v_is_owning_tutor := public.owns_tutor_profile(v_appt.tutor_profile_id);

  if not (v_is_student or v_is_owning_tutor or public.is_admin()) then
    raise exception 'You are not authorized to cancel this appointment.';
  end if;

  select * into v_slot from appointment_slots where id = v_appt.slot_id for update;
  v_starts_at := public.slot_starts_at(v_slot.slot_date, v_slot.start_time);

  if v_is_student and not public.is_admin() then
    if v_starts_at - now() < interval '2 hours' then
      raise exception 'Appointments can only be cancelled at least 2 hours before the scheduled time.';
    end if;
    v_action := 'STUDENT_CANCELLED_APPOINTMENT';
  elsif public.is_admin() then
    v_action := 'ADMIN_CANCELLED_APPOINTMENT';
  else
    v_action := 'TUTOR_CANCELLED_APPOINTMENT';
  end if;

  update appointments
    set status = 'cancelled', cancelled_by = auth.uid(), cancellation_reason = v_reason
    where id = p_appointment_id;

  if v_starts_at > now() then
    update appointment_slots set status = 'open' where id = v_slot.id;
  end if;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by, note)
  values (p_appointment_id, v_appt.status, 'cancelled', auth.uid(), v_reason);

  perform public.log_audit_event(v_action, 'appointment', p_appointment_id,
    jsonb_build_object('reason', v_reason));

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values
    (v_appt.student_id, 'appointment_cancelled', 'Appointment cancelled',
     'An appointment has been cancelled.', 'appointment', p_appointment_id),
    ((select profile_id from tutor_profiles where id = v_appt.tutor_profile_id), 'appointment_cancelled',
     'Appointment cancelled', 'An appointment has been cancelled.', 'appointment', p_appointment_id);
end;
$$;

-- create or replace keeps the old grants only for existing roles; set them explicitly.
revoke execute on function public.book_appointment_slot(uuid, text) from public, anon;
revoke execute on function public.cancel_appointment(uuid, text) from public, anon;
grant execute on function public.book_appointment_slot(uuid, text) to authenticated;
grant execute on function public.cancel_appointment(uuid, text) to authenticated;

-- ECoLearn — functions, triggers, and RLS policies
-- Read alongside docs/ARCHITECTURE.md, which explains the reasoning for
-- each decision below in prose.

-- ============================================================================
-- HELPER FUNCTIONS
-- SECURITY DEFINER + a pinned search_path so RLS policies can call these
-- without either recursing back into RLS or being hijacked by a hostile
-- search_path.
-- ============================================================================

create function public.current_profile_role()
returns app_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false);
$$;

create function public.owns_tutor_profile(p_tutor_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from tutor_profiles
    where id = p_tutor_profile_id and profile_id = auth.uid()
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.log_audit_event(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_metadata);
end;
$$;

-- ============================================================================
-- SIGN-UP: create a profile row when a new auth.users row appears.
-- Reads `role`, `first_name`, `last_name`, `phone` from the metadata passed
-- to supabase.auth.signUp({ options: { data: { ... } } }). Falls back to
-- 'student' for anything unexpected — an admin account is never created
-- this way, only seeded or promoted directly by another admin.
-- ============================================================================

create function public.handle_new_user()
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
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- PROFILES — guard rails + updated_at
-- ============================================================================

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

create function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change a user''s role.';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email changes must go through account settings, not this profile field.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged_fields
  before update on profiles
  for each row execute function public.guard_profile_privileged_fields();

-- ============================================================================
-- TUTOR APPLICATIONS — status machine
-- ============================================================================

create trigger tutor_applications_set_updated_at
  before update on tutor_applications
  for each row execute function public.set_updated_at();

create function public.enforce_application_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    -- Admin decisions must be justified, and the reviewer/timestamp are
    -- always system-set, never client-supplied.
    if new.status in ('rejected', 'needs_revision') and coalesce(trim(new.review_notes), '') = '' then
      raise exception 'A reason is required when rejecting an application or requesting revision.';
    end if;
    if new.status is distinct from old.status then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
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
    -- Reviewer fields are never client-writable.
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

create trigger tutor_applications_enforce_transition
  before update on tutor_applications
  for each row execute function public.enforce_application_status_transition();

create function public.handle_tutor_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_notif_title text;
  v_notif_body text;
begin
  if new.status = old.status then
    return new;
  end if;

  case new.status
    when 'pending' then
      v_action := 'TUTOR_SUBMITTED_APPLICATION';
      v_notif_title := 'Application submitted';
      v_notif_body := 'Your tutor application is now pending review.';
    when 'approved' then
      v_action := 'ADMIN_APPROVED_TUTOR';
      v_notif_title := 'Application approved';
      v_notif_body := 'Congratulations! Your tutor application has been approved. You can now set your availability.';
    when 'rejected' then
      v_action := 'ADMIN_REJECTED_TUTOR';
      v_notif_title := 'Application not approved';
      v_notif_body := coalesce(new.review_notes, 'Your tutor application was not approved.');
    when 'needs_revision' then
      v_action := 'ADMIN_REQUESTED_REVISION';
      v_notif_title := 'Revision requested';
      v_notif_body := coalesce(new.review_notes, 'Additional information is required before your application can be approved.');
    else
      v_action := 'ADMIN_UPDATED_APPLICATION_STATUS';
      v_notif_title := 'Application status updated';
      v_notif_body := 'Your application status changed to ' || new.status;
  end case;

  perform public.log_audit_event(v_action, 'tutor_application', new.id,
    jsonb_build_object('from', old.status, 'to', new.status));

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values (new.tutor_id, 'tutor_application_status', v_notif_title, v_notif_body, 'tutor_application', new.id);

  if new.status = 'approved' then
    insert into tutor_profiles (profile_id, application_id)
    values (new.tutor_id, new.id)
    on conflict (profile_id) do update
      set application_id = excluded.application_id,
          is_active = true,
          updated_at = now();

    insert into tutor_subjects (tutor_profile_id, subject_id)
    select tp.id, tas.subject_id
    from tutor_profiles tp
    join tutor_application_subjects tas on tas.application_id = new.id
    where tp.profile_id = new.tutor_id
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger tutor_applications_status_change
  after update on tutor_applications
  for each row execute function public.handle_tutor_application_status_change();

-- ============================================================================
-- TUTOR PROFILES — updated_at only; creation is system-driven (see above)
-- ============================================================================

create trigger tutor_profiles_set_updated_at
  before update on tutor_profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- AVAILABILITY -> APPOINTMENT SLOT GENERATION
-- ============================================================================

create function public.generate_appointment_slots(p_availability_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a availability%rowtype;
  v_cursor time;
begin
  select * into a from availability where id = p_availability_id;
  if not found then
    return;
  end if;

  delete from appointment_slots
  where availability_id = p_availability_id and status = 'open';

  v_cursor := a.start_time;
  while v_cursor + (a.slot_duration_minutes || ' minutes')::interval <= a.end_time loop
    insert into appointment_slots (
      availability_id, tutor_profile_id, subject_id, slot_date, start_time, end_time
    ) values (
      a.id, a.tutor_profile_id, a.subject_id, a.day_date,
      v_cursor, v_cursor + (a.slot_duration_minutes || ' minutes')::interval
    )
    on conflict (tutor_profile_id, slot_date, start_time) do nothing;
    v_cursor := v_cursor + (a.slot_duration_minutes || ' minutes')::interval;
  end loop;
end;
$$;

create function public.availability_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.generate_appointment_slots(new.id);
  perform public.log_audit_event('TUTOR_CREATED_AVAILABILITY', 'availability', new.id,
    jsonb_build_object('day_date', new.day_date, 'start_time', new.start_time, 'end_time', new.end_time));
  return new;
end;
$$;

create trigger availability_generate_slots
  after insert on availability
  for each row execute function public.availability_after_insert();

create function public.availability_after_update()
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

create trigger availability_regenerate_slots
  after update of start_time, end_time, slot_duration_minutes on availability
  for each row execute function public.availability_after_update();

create trigger availability_set_updated_at
  before update on availability
  for each row execute function public.set_updated_at();

create function public.availability_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_audit_event('TUTOR_DELETED_AVAILABILITY', 'availability', old.id,
    jsonb_build_object('day_date', old.day_date));
  return old;
end;
$$;

create trigger availability_log_delete
  after delete on availability
  for each row execute function public.availability_after_delete();

-- ============================================================================
-- BOOKING — the one and only way an appointment gets created.
-- Runs as SECURITY DEFINER so it can lock the slot and write across tables
-- atomically; there is deliberately no RLS INSERT policy on `appointments`,
-- so this function is the only path in or out of that table.
-- ============================================================================

create function public.book_appointment_slot(p_slot_id uuid, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot appointment_slots%rowtype;
  v_tutor_active boolean;
  v_appointment_id uuid;
begin
  if public.current_profile_role() is distinct from 'student' then
    raise exception 'Only students can book appointments.';
  end if;

  select * into v_slot from appointment_slots where id = p_slot_id for update;
  if not found then
    raise exception 'This appointment slot no longer exists.';
  end if;
  if v_slot.status <> 'open' then
    raise exception 'This slot is no longer available. Please choose another time.';
  end if;
  if (v_slot.slot_date + v_slot.start_time) <= now() then
    raise exception 'This slot has already passed.';
  end if;

  select is_active into v_tutor_active from tutor_profiles where id = v_slot.tutor_profile_id;
  if not coalesce(v_tutor_active, false) then
    raise exception 'This tutor is not currently accepting bookings.';
  end if;

  insert into appointments (slot_id, student_id, tutor_profile_id, subject_id, status, notes)
  values (v_slot.id, auth.uid(), v_slot.tutor_profile_id, v_slot.subject_id, 'scheduled', p_notes)
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

-- ============================================================================
-- CANCELLATION
-- ============================================================================

create function public.cancel_appointment(p_appointment_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_slot appointment_slots%rowtype;
  v_actor_role app_role := public.current_profile_role();
  v_is_student boolean;
  v_is_owning_tutor boolean;
  v_action text;
begin
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

  if v_is_student and not public.is_admin() then
    if (v_slot.slot_date + v_slot.start_time) - now() < interval '2 hours' then
      raise exception 'Appointments can only be cancelled at least 2 hours before the scheduled time.';
    end if;
    v_action := 'STUDENT_CANCELLED_APPOINTMENT';
  elsif public.is_admin() then
    v_action := 'ADMIN_CANCELLED_APPOINTMENT';
  else
    v_action := 'TUTOR_CANCELLED_APPOINTMENT';
  end if;

  update appointments
    set status = 'cancelled', cancelled_by = auth.uid(), cancellation_reason = p_reason
    where id = p_appointment_id;

  if (v_slot.slot_date + v_slot.start_time) > now() then
    update appointment_slots set status = 'open' where id = v_slot.id;
  end if;

  insert into appointment_status_history (appointment_id, from_status, to_status, changed_by, note)
  values (p_appointment_id, v_appt.status, 'cancelled', auth.uid(), p_reason);

  perform public.log_audit_event(v_action, 'appointment', p_appointment_id,
    jsonb_build_object('reason', p_reason));

  insert into notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
  values
    (v_appt.student_id, 'appointment_cancelled', 'Appointment cancelled',
     'An appointment has been cancelled.', 'appointment', p_appointment_id),
    ((select profile_id from tutor_profiles where id = v_appt.tutor_profile_id), 'appointment_cancelled',
     'Appointment cancelled', 'An appointment has been cancelled.', 'appointment', p_appointment_id);
end;
$$;

create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table subjects enable row level security;
alter table tutor_applications enable row level security;
alter table tutor_application_subjects enable row level security;
alter table tutor_credentials enable row level security;
alter table tutor_profiles enable row level security;
alter table tutor_subjects enable row level security;
alter table availability enable row level security;
alter table appointment_slots enable row level security;
alter table appointments enable row level security;
alter table appointment_status_history enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- ---- profiles ----

create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from tutor_profiles tp
      where tp.profile_id = profiles.id and tp.is_active
    )
  );

create policy profiles_update on profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- No insert/delete policies for regular clients: rows are created by the
-- on_auth_user_created trigger and removed only by cascading from auth.users.

-- ---- subjects ----

create policy subjects_select_public on subjects for select using (true);

create policy subjects_admin_write on subjects for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- tutor_applications ----

create policy tutor_applications_select on tutor_applications for select
  using (tutor_id = auth.uid() or public.is_admin());

create policy tutor_applications_insert on tutor_applications for insert
  with check (
    tutor_id = auth.uid()
    and public.current_profile_role() = 'tutor'
  );

create policy tutor_applications_update on tutor_applications for update
  using (
    (tutor_id = auth.uid() and status in ('draft', 'needs_revision'))
    or public.is_admin()
  )
  with check (tutor_id = auth.uid() or public.is_admin());

create policy tutor_applications_delete on tutor_applications for delete
  using ((tutor_id = auth.uid() and status = 'draft') or public.is_admin());

-- ---- tutor_application_subjects ----

create policy tutor_application_subjects_select on tutor_application_subjects for select
  using (
    public.is_admin()
    or exists (
      select 1 from tutor_applications ta
      where ta.id = tutor_application_subjects.application_id and ta.tutor_id = auth.uid()
    )
  );

create policy tutor_application_subjects_write on tutor_application_subjects for all
  using (
    public.is_admin()
    or exists (
      select 1 from tutor_applications ta
      where ta.id = tutor_application_subjects.application_id
        and ta.tutor_id = auth.uid()
        and ta.status in ('draft', 'needs_revision')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from tutor_applications ta
      where ta.id = tutor_application_subjects.application_id
        and ta.tutor_id = auth.uid()
        and ta.status in ('draft', 'needs_revision')
    )
  );

-- ---- tutor_credentials ---- (never public; owner tutor or admin only)

create policy tutor_credentials_select on tutor_credentials for select
  using (
    public.is_admin()
    or exists (
      select 1 from tutor_applications ta
      where ta.id = tutor_credentials.application_id and ta.tutor_id = auth.uid()
    )
  );

create policy tutor_credentials_write on tutor_credentials for all
  using (
    public.is_admin()
    or exists (
      select 1 from tutor_applications ta
      where ta.id = tutor_credentials.application_id
        and ta.tutor_id = auth.uid()
        and ta.status in ('draft', 'pending', 'needs_revision')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from tutor_applications ta
      where ta.id = tutor_credentials.application_id
        and ta.tutor_id = auth.uid()
        and ta.status in ('draft', 'pending', 'needs_revision')
    )
  );

-- ---- tutor_profiles ---- (public directory)

create policy tutor_profiles_select_public on tutor_profiles for select
  using (is_active or profile_id = auth.uid() or public.is_admin());

create policy tutor_profiles_update on tutor_profiles for update
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create policy tutor_profiles_admin_delete on tutor_profiles for delete
  using (public.is_admin());

-- Only admins/the system (SECURITY DEFINER trigger) create tutor_profiles
-- rows — no insert policy needed for regular clients.

-- ---- tutor_subjects ----

create policy tutor_subjects_select_public on tutor_subjects for select using (true);

create policy tutor_subjects_write on tutor_subjects for all
  using (public.owns_tutor_profile(tutor_profile_id) or public.is_admin())
  with check (public.owns_tutor_profile(tutor_profile_id) or public.is_admin());

-- ---- availability ---- (tutor + admin only; students browse slots instead)

create policy availability_select on availability for select
  using (public.owns_tutor_profile(tutor_profile_id) or public.is_admin());

create policy availability_write on availability for all
  using (public.owns_tutor_profile(tutor_profile_id) or public.is_admin())
  with check (public.owns_tutor_profile(tutor_profile_id) or public.is_admin());

-- ---- appointment_slots ---- (open slots are publicly browsable)

create policy appointment_slots_select on appointment_slots for select
  using (
    status = 'open'
    or public.owns_tutor_profile(tutor_profile_id)
    or public.is_admin()
    or exists (
      select 1 from appointments a
      where a.slot_id = appointment_slots.id and a.student_id = auth.uid()
    )
  );

create policy appointment_slots_write on appointment_slots for all
  using (public.owns_tutor_profile(tutor_profile_id) or public.is_admin())
  with check (public.owns_tutor_profile(tutor_profile_id) or public.is_admin());

-- ---- appointments ---- (no insert/delete policy: booking goes through
-- book_appointment_slot(), cancellation through cancel_appointment())

create policy appointments_select on appointments for select
  using (
    student_id = auth.uid()
    or public.owns_tutor_profile(tutor_profile_id)
    or public.is_admin()
  );

create policy appointments_update on appointments for update
  using (public.owns_tutor_profile(tutor_profile_id) or public.is_admin())
  with check (public.owns_tutor_profile(tutor_profile_id) or public.is_admin());

-- ---- appointment_status_history ---- (read-only mirror of appointments)

create policy appointment_status_history_select on appointment_status_history for select
  using (
    exists (
      select 1 from appointments a
      where a.id = appointment_status_history.appointment_id
        and (a.student_id = auth.uid() or public.owns_tutor_profile(a.tutor_profile_id))
    )
    or public.is_admin()
  );

-- ---- notifications ----

create policy notifications_select on notifications for select
  using (profile_id = auth.uid());

create policy notifications_update on notifications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy notifications_delete on notifications for delete
  using (profile_id = auth.uid());

-- ---- audit_logs ---- (admin read-only; writes go through log_audit_event)

create policy audit_logs_select on audit_logs for select
  using (public.is_admin());

-- ============================================================================
-- STORAGE
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('tutor-credentials', 'tutor-credentials', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- tutor-credentials: path convention "{auth.uid()}/{application_id}/{filename}"
create policy tutor_credentials_storage_owner_rw on storage.objects for all
  using (
    bucket_id = 'tutor-credentials'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'tutor-credentials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars: public read (bucket is public), owner-only write.
-- Path convention "{auth.uid()}/{filename}"
create policy avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_owner_write on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_owner_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_owner_delete on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

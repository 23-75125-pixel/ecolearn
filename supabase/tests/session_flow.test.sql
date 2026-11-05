-- ECoLearn - database tests for sessions, booking and access rules.
--
-- Run against a LOCAL database that has all migrations and supabase/seed/seed.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/session_flow.test.sql
-- Everything runs in one transaction that is rolled back at the end, so the
-- database is left as it was. A failed check stops the script with a message.

begin;

create schema t;
grant usage on schema t to authenticated, anon;

create function t.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create function t.logout() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;

-- Runs p_sql and requires it to fail with a message containing p_expect.
create function t.fails(p_sql text, p_expect text) returns void language plpgsql as $$
declare
  v_message text;
begin
  begin
    execute p_sql;
  exception when others then
    v_message := sqlerrm;
  end;
  if v_message is null then
    raise exception 'EXPECTED FAILURE (%) BUT SUCCEEDED: %', p_expect, p_sql;
  end if;
  if position(p_expect in v_message) = 0 then
    raise exception 'WRONG ERROR for %: expected "%", got "%"', p_sql, p_expect, v_message;
  end if;
end $$;

create function t.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then
    raise exception 'CHECK FAILED: %', p_label;
  end if;
  raise notice 'ok - %', p_label;
end $$;

grant execute on all functions in schema t to authenticated, anon;

do $$
declare
  admin_id    constant uuid := '00000000-0000-0000-0000-000000000001';
  student1    constant uuid := '00000000-0000-0000-0000-000000000011';
  student2    constant uuid := '00000000-0000-0000-0000-000000000012';
  tutor_ok    constant uuid := '00000000-0000-0000-0000-000000000021';
  tutor_wait  constant uuid := '00000000-0000-0000-0000-000000000022';
  tutor_rev   constant uuid := '00000000-0000-0000-0000-000000000023';
  v_tp uuid; v_av uuid; v_slot uuid; v_slot2 uuid; v_slot3 uuid; v_appt uuid; v_appt2 uuid;
  v_avail_online uuid; v_avail_person uuid; v_status text; v_count int; v_url text;
begin
  select id into v_tp from tutor_profiles where profile_id = tutor_ok;

  -- ---- availability rules (tutor) -----------------------------------------
  perform t.login(tutor_ok);
  perform t.fails(format($q$insert into availability (tutor_profile_id, day_date, start_time, end_time, slot_duration_minutes, session_mode, meeting_url)
    values (%L, current_date - 1, '09:00', '10:00', 60, 'online', 'https://meet.example.com/abc')$q$, v_tp), 'future');
  perform t.fails(format($q$insert into availability (tutor_profile_id, day_date, start_time, end_time, slot_duration_minutes, session_mode)
    values (%L, current_date + 60, '09:00', '10:00', 60, 'online')$q$, v_tp), 'availability_session_details_check');
  perform t.fails(format($q$insert into availability (tutor_profile_id, day_date, start_time, end_time, slot_duration_minutes, session_mode, meeting_url)
    values (%L, current_date + 60, '09:00', '10:00', 60, 'online', 'http://insecure.example.com')$q$, v_tp), 'availability_meeting_url_check');
  perform t.fails(format($q$insert into availability (tutor_profile_id, day_date, start_time, end_time, slot_duration_minutes, session_mode)
    values (%L, current_date + 60, '09:00', '10:00', 60, 'in_person')$q$, v_tp), 'availability_session_details_check');

  insert into availability (tutor_profile_id, day_date, start_time, end_time, slot_duration_minutes, session_mode, meeting_url)
    values (v_tp, current_date + 61, '09:00', '11:00', 60, 'online', 'https://meet.example.com/room-1') returning id into v_avail_online;
  insert into availability (tutor_profile_id, day_date, start_time, end_time, slot_duration_minutes, session_mode, location)
    values (v_tp, current_date + 62, '09:00', '10:00', 60, 'in_person', 'Library, room 2') returning id into v_avail_person;
  perform t.logout();
  select count(*) into v_count from appointment_slots where availability_id = v_avail_online;
  perform t.check(v_count = 2, 'a 2-hour online window with 60-minute slots makes 2 slots');
  perform t.check((select session_mode from appointment_slots where availability_id = v_avail_person) = 'in_person', 'slots inherit the in-person type');

  -- ---- booking ------------------------------------------------------------
  select id into v_slot from appointment_slots where availability_id = v_avail_online order by start_time limit 1;
  select id into v_slot2 from appointment_slots where availability_id = v_avail_online order by start_time desc limit 1;
  select id into v_slot3 from appointment_slots where availability_id = v_avail_person limit 1;

  perform t.login(tutor_ok);
  perform t.fails(format('select public.book_appointment_slot(%L)', v_slot), 'Only students');
  perform t.logout();
  perform t.login(student1);
  v_appt := public.book_appointment_slot(v_slot, 'I need help with fractions');
  perform t.logout();
  select status::text, meeting_url into v_status, v_url from appointments where id = v_appt;
  perform t.check(v_status = 'scheduled', 'a new booking starts as scheduled (waiting for the tutor)');
  perform t.check(v_url = 'https://meet.example.com/room-1', 'the meeting link is copied onto the appointment');
  perform t.check((select status from appointment_slots where id = v_slot) = 'booked', 'the slot is marked booked');
  perform t.check((select count(*) from notifications where related_entity_id = v_appt) = 2, 'student and tutor are both notified');

  perform t.login(student2);
  perform t.fails(format('select public.book_appointment_slot(%L)', v_slot), 'no longer available');
  perform t.fails(format('select public.confirm_appointment(%L)', v_appt), 'not authorized');
  perform t.check((select count(*) from appointments where id = v_appt) = 0, 'another student cannot even read the appointment');
  perform t.fails(format($q$update appointments set status = 'completed' where id = %L$q$, v_appt), 'permission denied');
  perform t.logout();

  perform t.login(student1);
  perform t.fails(format('select public.book_appointment_slot(%L, %L)', v_slot2, repeat('x', 1001)), '1000 characters');
  v_appt2 := public.book_appointment_slot(v_slot3, null);
  perform t.check((select session_mode from appointments where id = v_appt2) = 'in_person'
                  and (select location from appointments where id = v_appt2) = 'Library, room 2', 'in-person details are copied onto the appointment');
  perform t.logout();

  -- ---- the tutor's availability cannot be pulled out from under a booking ---
  perform t.login(tutor_ok);
  perform t.fails(format('delete from availability where id = %L', v_avail_online), 'active appointments');
  perform t.fails(format($q$update availability set end_time = '10:00' where id = %L$q$, v_avail_online), 'cannot be reshaped');
  perform t.logout();

  -- ---- confirm ------------------------------------------------------------
  perform t.login(student1);
  perform t.fails(format('select public.confirm_appointment(%L)', v_appt), 'not authorized');
  perform t.logout();
  perform t.login(tutor_wait);
  perform t.fails(format('select public.confirm_appointment(%L)', v_appt), 'not authorized');
  perform t.logout();
  perform t.login(tutor_ok);
  perform public.confirm_appointment(v_appt);
  perform t.fails(format('select public.confirm_appointment(%L)', v_appt), 'new session request');
  perform t.fails(format('select public.complete_appointment(%L)', v_appt), 'not started');
  perform t.fails(format('select public.mark_appointment_no_show(%L)', v_appt), '15 minutes');
  perform t.logout();
  perform t.check((select status from appointments where id = v_appt) = 'confirmed', 'the tutor can confirm a request');
  perform t.check((select count(*) from notifications where related_entity_id = v_appt and type = 'appointment_confirmed') = 1, 'the student is told it was confirmed');

  -- ---- cancellation rules --------------------------------------------------
  -- Move slot 2 to start in 1 hour: a student may no longer cancel it.
  update appointment_slots set slot_date = (now() at time zone 'Asia/Manila')::date,
         start_time = ((now() at time zone 'Asia/Manila') + interval '1 hour')::time(0),
         end_time   = ((now() at time zone 'Asia/Manila') + interval '2 hours')::time(0)
   where id = v_slot3;
  perform t.login(student1);
  perform t.fails(format('select public.cancel_appointment(%L)', v_appt2), '2 hours');
  perform t.logout();
  perform t.login(tutor_ok);
  perform t.fails(format('select public.cancel_appointment(%L)', v_appt2), 'reason');
  perform public.cancel_appointment(v_appt2, 'I am not feeling well');
  perform t.logout();
  perform t.check((select status from appointments where id = v_appt2) = 'cancelled', 'a tutor can cancel with a reason, even close to the start');
  perform t.check((select status from appointment_slots where id = v_slot3) = 'cancelled', 'a tutor cancellation does not reopen the slot');
  perform t.check((select count(*) from notifications where related_entity_id = v_appt2 and body like '%not feeling well%') >= 1, 'the student is told the reason');

  -- A student cancelling in good time reopens the slot.
  perform t.login(student1);
  v_appt2 := public.book_appointment_slot(v_slot2, null);
  perform public.cancel_appointment(v_appt2, 'Change of plans');
  perform t.logout();
  perform t.check((select status from appointment_slots where id = v_slot2) = 'open', 'a student cancellation reopens the slot');
  perform t.login(student1);
  perform t.fails(format('select public.cancel_appointment(%L)', v_appt2), 'no longer be cancelled');
  perform t.logout();

  -- ---- complete / no-show (move the confirmed session into the past) ---------
  update appointment_slots set slot_date = current_date - 2 where id = v_slot;
  perform t.login(student1);
  perform t.fails(format('select public.complete_appointment(%L)', v_appt), 'not authorized');
  perform t.fails(format('select public.cancel_appointment(%L)', v_appt), 'already started');
  perform t.logout();
  perform t.login(tutor_ok);
  perform public.complete_appointment(v_appt);
  perform t.logout();
  perform t.check((select status from appointments where id = v_appt) = 'completed', 'the tutor can complete a session that has started');
  perform t.check((select count(*) from appointment_status_history where appointment_id = v_appt) = 3, 'every change is recorded in the history');
  perform t.login(tutor_ok);
  perform t.fails(format('delete from availability where id = %L', v_avail_online), 'appointment history');
  perform t.logout();

  -- ---- application review ----------------------------------------------------
  perform t.login(admin_id);
  perform t.fails(format($q$update tutor_applications set status = 'approved' where tutor_id = %L$q$, tutor_rev), 'not waiting for a decision');
  perform t.fails(format($q$update tutor_applications set status = 'rejected' where tutor_id = %L$q$, tutor_wait), 'reason is required');
  update tutor_applications set status = 'approved' where tutor_id = tutor_wait;
  perform t.logout();
  perform t.check((select count(*) from tutor_profiles where profile_id = tutor_wait and is_active) = 1, 'approving a pending application creates the tutor profile');
  perform t.login(tutor_wait);
  update tutor_applications set status = 'pending' where tutor_id = tutor_wait;  -- no row is visible to update
  perform t.logout();
  perform t.check((select status from tutor_applications where tutor_id = tutor_wait) = 'approved', 'a tutor cannot reopen an approved application');

  -- ---- who can see what ------------------------------------------------------
  perform t.login(student2);
  perform t.check((select count(*) from availability) = 0, 'a student cannot read availability (it holds meeting links)');
  perform t.check((select count(*) from tutor_applications) = 0, 'a student cannot read tutor applications');
  perform t.logout();
  perform t.login(tutor_ok);
  perform t.check((select count(*) from tutor_applications where tutor_id <> tutor_ok) = 0, 'a tutor sees only their own application');
  perform t.check((select count(*) from appointments where tutor_profile_id <> v_tp) = 0, 'a tutor sees only their own appointments');
  perform t.logout();
  perform t.login(student1);
  perform t.check((select count(*) from appointments where student_id <> student1) = 0, 'a student sees only their own appointments');
  perform t.check((select count(*) from audit_logs) = 0, 'a student cannot read audit logs');
  perform t.logout();
  perform t.login(admin_id);
  perform t.check((select count(*) from audit_logs) > 0, 'an admin can read audit logs');
  perform t.logout();
end $$;

rollback;

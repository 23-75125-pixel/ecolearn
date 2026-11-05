-- Keep public slot session modes in sync with their availability window.
--
-- Older databases may have generated slots with the column default (`online`)
-- before the session-mode-aware generator was installed. Open slots are safe
-- to repair; booked appointments retain their snapshot on purpose.

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

  update appointment_slots
  set session_mode = a.session_mode
  where availability_id = p_availability_id
    and status = 'open';

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

-- Repair rows left by an earlier generator without changing booked history.
update appointment_slots s
set session_mode = a.session_mode
from availability a
where a.id = s.availability_id
  and s.status = 'open'
  and s.session_mode is distinct from a.session_mode;

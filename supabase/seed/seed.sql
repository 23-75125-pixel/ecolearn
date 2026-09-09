-- ECoLearn — local development seed data.
--
-- Run with the Supabase CLI: `supabase db reset` (runs migrations, then this
-- file) against your LOCAL dev stack only. Do not run this against a
-- production project — it creates auth.users rows directly with a shared
-- placeholder password, which is fine for local dev and demoing the thesis,
-- and unsafe anywhere real users might reuse that password.
--
-- All demo accounts use the password:  Passw0rd!
--
-- If your local GoTrue version rejects this INSERT (the auth.users column
-- set changes between versions), create the same users instead with the
-- Admin API (`supabase.auth.admin.createUser`) in a one-off Node script and
-- keep the rest of this file as-is — profiles/applications/etc. below only
-- need the resulting auth.users.id values.

do $$
declare
  v_admin_id       uuid := '00000000-0000-0000-0000-000000000001';
  v_student1_id    uuid := '00000000-0000-0000-0000-000000000011';
  v_student2_id    uuid := '00000000-0000-0000-0000-000000000012';
  v_student3_id    uuid := '00000000-0000-0000-0000-000000000013';
  v_tutor_approved_id  uuid := '00000000-0000-0000-0000-000000000021';
  v_tutor_pending_id   uuid := '00000000-0000-0000-0000-000000000022';
  v_tutor_revision_id  uuid := '00000000-0000-0000-0000-000000000023';
  v_tutor_rejected_id  uuid := '00000000-0000-0000-0000-000000000024';

  v_subject_math    uuid;
  v_subject_science uuid;
  v_subject_english uuid;
  v_subject_cs      uuid;

  v_application_approved_id uuid;
  v_tutor_profile_id        uuid;
  v_availability_id         uuid;
  v_slot_id                 uuid;
begin

  -- ---- auth.users + profiles (profiles rows are created by the
  -- handle_new_user trigger, reading raw_user_meta_data below) ----

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values
    ('00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
     'admin@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"admin","first_name":"Ava","last_name":"Santos"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_student1_id, 'authenticated', 'authenticated',
     'student1@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","first_name":"Miguel","last_name":"Dela Cruz"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_student2_id, 'authenticated', 'authenticated',
     'student2@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","first_name":"Bea","last_name":"Reyes"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_student3_id, 'authenticated', 'authenticated',
     'student3@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","first_name":"Carlo","last_name":"Bautista"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_tutor_approved_id, 'authenticated', 'authenticated',
     'tutor.approved@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"tutor","first_name":"Liza","last_name":"Fernandez"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_tutor_pending_id, 'authenticated', 'authenticated',
     'tutor.pending@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"tutor","first_name":"Noel","last_name":"Garcia"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_tutor_revision_id, 'authenticated', 'authenticated',
     'tutor.revision@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"tutor","first_name":"Jasmine","last_name":"Torres"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_tutor_rejected_id, 'authenticated', 'authenticated',
     'tutor.rejected@ecolearn.test', crypt('Passw0rd!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"tutor","first_name":"Rico","last_name":"Aquino"}',
     now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  -- The on_auth_user_created trigger only ever creates 'student' or
  -- 'tutor' profiles (by design — nobody should be able to self-register
  -- as admin via signup metadata; see handle_new_user() in
  -- 0002_functions_triggers_rls.sql). Promote the seeded admin account by
  -- briefly disabling the role-change guard trigger, exactly like a real
  -- admin promotion would also have to happen out-of-band.
  alter table profiles disable trigger profiles_guard_privileged_fields;
  update profiles set role = 'admin' where id = v_admin_id;
  alter table profiles enable trigger profiles_guard_privileged_fields;

  -- ---- subjects ----

  insert into subjects (name, slug) values
    ('Mathematics', 'mathematics'),
    ('Science', 'science'),
    ('English', 'english'),
    ('Computer Programming', 'computer-programming')
  on conflict (name) do nothing;

  select id into v_subject_math    from subjects where slug = 'mathematics';
  select id into v_subject_science from subjects where slug = 'science';
  select id into v_subject_english from subjects where slug = 'english';
  select id into v_subject_cs      from subjects where slug = 'computer-programming';

  -- ---- tutor applications (one per demo tutor, in different states) ----

  insert into tutor_applications (
    id, tutor_id, status, school_name, degree, major, graduation_year,
    teaching_experience_summary, years_experience, teaching_approach, preferred_modes,
    submitted_at
  ) values (
    gen_random_uuid(), v_tutor_approved_id, 'pending',
    'University of the Philippines', 'BS Mathematics', 'Applied Mathematics', 2018,
    '6 years tutoring high school and college students in math and statistics.', 6,
    'Patient, example-driven, checks understanding before moving on.', '{online,hybrid}',
    now() - interval '20 days'
  ) returning id into v_application_approved_id;

  insert into tutor_application_subjects (application_id, subject_id) values
    (v_application_approved_id, v_subject_math),
    (v_application_approved_id, v_subject_science);

  insert into tutor_applications (
    tutor_id, status, school_name, degree, major, graduation_year,
    teaching_experience_summary, years_experience, teaching_approach, preferred_modes,
    submitted_at
  ) values (
    v_tutor_pending_id, 'pending',
    'Ateneo de Manila University', 'BS Computer Science', 'Software Engineering', 2021,
    '2 years as a part-time programming instructor.', 2,
    'Project-based, learn by building.', '{online}',
    now() - interval '2 days'
  );

  insert into tutor_applications (
    tutor_id, status, school_name, degree, major, graduation_year,
    teaching_experience_summary, years_experience, teaching_approach, preferred_modes,
    submitted_at, reviewed_at, reviewed_by, review_notes
  ) values (
    v_tutor_revision_id, 'needs_revision',
    'De La Salle University', 'BA English', 'Literature', 2019,
    'Freelance English and essay-writing tutor.', 3,
    'Socratic questioning, lots of writing practice.', '{online,in_person}',
    now() - interval '5 days', now() - interval '3 days', v_admin_id,
    'Please upload a clearer scan of your diploma — the one on file is not legible.'
  );

  insert into tutor_applications (
    tutor_id, status, school_name, degree, major, graduation_year,
    teaching_experience_summary, years_experience, teaching_approach, preferred_modes,
    submitted_at, reviewed_at, reviewed_by, review_notes
  ) values (
    v_tutor_rejected_id, 'rejected',
    'Unlisted institution', 'N/A', 'N/A', null,
    'Self-taught, no formal tutoring experience yet.', 0,
    'N/A', '{online}',
    now() - interval '10 days', now() - interval '9 days', v_admin_id,
    'We were unable to verify the submitted credentials. You are welcome to reapply with complete documentation.'
  );

  -- Approving via UPDATE (not a fresh INSERT of status='approved') so the
  -- handle_tutor_application_status_change trigger actually fires and
  -- creates the tutor_profiles row, exactly like it would in production.
  --
  -- enforce_application_status_transition() only allows this transition
  -- for an admin, checked via is_admin() -> auth.uid(). Outside of
  -- PostgREST there's no request JWT to read, so we set the same GUC
  -- Supabase's real auth.uid() reads (`request.jwt.claim.sub`) to act as
  -- each demo user for the rest of this block — this is standard practice
  -- for seed scripts that need to exercise real RLS/triggers as a
  -- specific user, and behaves identically against a real Supabase project.
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  update tutor_applications set status = 'approved' where id = v_application_approved_id;

  select id into v_tutor_profile_id from tutor_profiles where profile_id = v_tutor_approved_id;

  update tutor_profiles
    set headline = 'Math & Science tutor, UP graduate',
        bio = 'I help high school and college students build genuine confidence in math and the sciences, not just memorize formulas.'
    where id = v_tutor_profile_id;

  -- ---- availability + generated slots for the approved tutor ----
  -- Acting as the tutor now, so the TUTOR_CREATED_AVAILABILITY audit log
  -- entries attribute correctly.
  perform set_config('request.jwt.claim.sub', v_tutor_approved_id::text, true);

  insert into availability (tutor_profile_id, subject_id, day_date, start_time, end_time, slot_duration_minutes)
  values (v_tutor_profile_id, v_subject_math, current_date + interval '2 days', '09:00', '12:00', 60)
  returning id into v_availability_id;

  insert into availability (tutor_profile_id, subject_id, day_date, start_time, end_time, slot_duration_minutes)
  values (v_tutor_profile_id, v_subject_science, current_date + interval '3 days', '13:00', '16:00', 60);

  -- ---- one sample booking, so dashboards have something to show ----
  -- Acting as the student, and going through the real booking RPC —
  -- exercises book_appointment_slot() itself rather than hand-inserting.

  select id into v_slot_id
  from appointment_slots
  where availability_id = v_availability_id and status = 'open'
  order by start_time
  limit 1;

  if v_slot_id is not null then
    perform set_config('request.jwt.claim.sub', v_student1_id::text, true);
    perform book_appointment_slot(v_slot_id, 'First session — algebra review.');
  end if;

  -- Clear the impersonated identity so anything run after this script in
  -- the same session (e.g. manual poking around in `psql`) isn't
  -- accidentally still "logged in" as a demo student.
  perform set_config('request.jwt.claim.sub', '', true);

end $$;

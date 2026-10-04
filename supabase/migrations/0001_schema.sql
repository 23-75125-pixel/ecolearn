-- ECoLearn — core schema
-- Tables, enums, indexes, and structural constraints only.
-- Functions, triggers, and RLS policies live in 0002_functions_triggers_rls.sql.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- exclusion constraints on availability

-- ============================================================================
-- ENUMS
-- ============================================================================

create type app_role as enum ('student', 'tutor', 'admin');

create type application_status as enum (
  'draft',
  'pending',
  'under_review',
  'needs_revision',
  'approved',
  'rejected'
);

create type credential_type as enum (
  'valid_id',
  'diploma',
  'certificate',
  'teaching_credential',
  'other'
);

create type teaching_mode as enum ('online', 'in_person', 'hybrid');

create type slot_status as enum ('open', 'booked', 'cancelled');

create type appointment_status as enum (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

-- ============================================================================
-- PROFILES
-- One row per auth.users row. `role` is a single primary role
-- (Student / Tutor / Admin) — this project doesn't need multi-role users,
-- so a dedicated `roles` table would be unused complexity; documented in
-- docs/ARCHITECTURE.md.
-- ============================================================================

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        app_role not null default 'student',
  first_name  text not null default '',
  middle_name text,
  last_name   text not null default '',
  email       text not null,
  phone       text,
  address     text,
  date_of_birth date,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

-- ============================================================================
-- SUBJECTS (admin-managed catalog)
-- ============================================================================

create table subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TUTOR APPLICATIONS (Phase 1 onboarding)
-- ============================================================================

create table tutor_applications (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references profiles (id) on delete cascade,
  status        application_status not null default 'draft',

  -- Step 2 — academic information
  school_name           text,
  degree                text,
  major                 text,
  graduation_year       int,
  academic_achievements text,

  -- Step 3 — teaching information
  teaching_experience_summary text,
  years_experience             int,
  teaching_approach             text,
  preferred_modes                teaching_mode[] not null default '{}',

  -- Step 5 — review
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  reviewed_by    uuid references profiles (id),
  review_notes   text, -- shown to the tutor: revision instructions or rejection reason

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tutor_applications_years_experience_check
    check (years_experience is null or years_experience >= 0),
  constraint tutor_applications_graduation_year_check
    check (graduation_year is null or graduation_year between 1950 and 2100)
);

-- A tutor has exactly one application "in flight" at a time. Re-applying
-- after a rejection is handled by editing the same row back to 'pending'
-- rather than creating a second application — keeps history simple.
create unique index tutor_applications_one_per_tutor_idx on tutor_applications (tutor_id);

create index tutor_applications_status_idx on tutor_applications (status);

create table tutor_application_subjects (
  application_id uuid not null references tutor_applications (id) on delete cascade,
  subject_id     uuid not null references subjects (id) on delete restrict,
  primary key (application_id, subject_id)
);

create table tutor_credentials (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references tutor_applications (id) on delete cascade,
  credential_type credential_type not null,
  storage_path    text not null, -- path within the private `tutor-credentials` bucket
  file_name       text not null,
  mime_type       text,
  file_size       bigint,
  uploaded_at     timestamptz not null default now()
);

create index tutor_credentials_application_idx on tutor_credentials (application_id);

-- ============================================================================
-- TUTOR PROFILES (Phase 2+ — public-facing)
-- A row here is created ONLY when a tutor_applications row transitions to
-- 'approved' (see the handle_tutor_application_approval trigger). This is a
-- deliberate structural choice: availability and appointment_slots both
-- reference tutor_profiles.id, so an unapproved tutor has no row to attach
-- a slot to. "Only approved tutors can create availability" (business rule
-- 1) is therefore enforced by the schema itself, not only by RLS.
-- ============================================================================

create table tutor_profiles (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null unique references profiles (id) on delete cascade,
  application_id    uuid references tutor_applications (id),
  headline          text,
  bio               text,
  is_active         boolean not null default true, -- admin kill-switch; doesn't delete history
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index tutor_profiles_active_idx on tutor_profiles (is_active);

create table tutor_subjects (
  tutor_profile_id uuid not null references tutor_profiles (id) on delete cascade,
  subject_id       uuid not null references subjects (id) on delete restrict,
  primary key (tutor_profile_id, subject_id)
);

-- ============================================================================
-- AVAILABILITY & GENERATED SLOTS
-- ============================================================================

create table availability (
  id                    uuid primary key default gen_random_uuid(),
  tutor_profile_id      uuid not null references tutor_profiles (id) on delete cascade,
  subject_id            uuid references subjects (id),
  day_date              date not null,
  start_time            time not null,
  end_time              time not null,
  slot_duration_minutes int not null default 60,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint availability_time_order_check check (end_time > start_time),
  constraint availability_duration_check check (slot_duration_minutes > 0),
  constraint availability_duration_fits_window_check
    check (extract(epoch from (end_time - start_time)) / 60 >= slot_duration_minutes),

  -- A tutor cannot create two overlapping availability windows on the same
  -- date. Enforced with an exclusion constraint (needs btree_gist), not
  -- just app-side validation.
  exclude using gist (
    tutor_profile_id with =,
    day_date with =,
    tsrange((day_date + start_time)::timestamp, (day_date + end_time)::timestamp) with &&
  )
);

create index availability_tutor_idx on availability (tutor_profile_id, day_date);

create table appointment_slots (
  id               uuid primary key default gen_random_uuid(),
  availability_id  uuid not null references availability (id) on delete cascade,
  tutor_profile_id uuid not null references tutor_profiles (id) on delete cascade,
  subject_id       uuid references subjects (id),
  slot_date        date not null,
  start_time       time not null,
  end_time         time not null,
  status           slot_status not null default 'open',
  created_at       timestamptz not null default now(),

  constraint appointment_slots_time_order_check check (end_time > start_time)
);

-- No two identical slots for the same tutor (belt-and-suspenders alongside
-- the availability exclusion constraint above).
create unique index appointment_slots_unique_idx
  on appointment_slots (tutor_profile_id, slot_date, start_time);

create index appointment_slots_lookup_idx
  on appointment_slots (tutor_profile_id, slot_date, status);

create index appointment_slots_open_idx
  on appointment_slots (status, slot_date) where status = 'open';

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================

create table appointments (
  id                  uuid primary key default gen_random_uuid(),
  slot_id             uuid not null references appointment_slots (id),
  student_id          uuid not null references profiles (id),
  tutor_profile_id    uuid not null references tutor_profiles (id),
  subject_id          uuid references subjects (id),
  status              appointment_status not null default 'scheduled',
  notes               text,
  cancelled_by        uuid references profiles (id),
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- The core anti-double-booking rule: at most one *active* (non-cancelled)
-- appointment per slot. Combined with the SECURITY DEFINER booking function
-- (which locks the slot row before inserting), this is enforced even under
-- concurrent requests — the database is the final authority, not app code.
create unique index appointments_one_active_per_slot_idx
  on appointments (slot_id) where status <> 'cancelled';

create index appointments_student_idx on appointments (student_id, status);
create index appointments_tutor_idx on appointments (tutor_profile_id, status);

create table appointment_status_history (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  from_status    appointment_status,
  to_status      appointment_status not null,
  changed_by     uuid references profiles (id),
  changed_at     timestamptz not null default now(),
  note           text
);

create index appointment_status_history_appointment_idx
  on appointment_status_history (appointment_id);

-- ============================================================================
-- NOTIFICATIONS & AUDIT LOG
-- ============================================================================

create table notifications (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references profiles (id) on delete cascade,
  type               text not null,
  title              text not null,
  body               text,
  is_read            boolean not null default false,
  related_entity_type text,
  related_entity_id   uuid,
  created_at         timestamptz not null default now()
);

create index notifications_profile_idx on notifications (profile_id, is_read);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles (id),
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_action_idx on audit_logs (action);
create index audit_logs_target_idx on audit_logs (target_type, target_id);

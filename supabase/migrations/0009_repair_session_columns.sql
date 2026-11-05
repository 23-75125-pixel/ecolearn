-- Repair migration for databases where 0008 was recorded as applied but its
-- session detail columns are missing.
--
-- This is intentionally idempotent. A normal database already has these
-- columns and is unchanged; a partially migrated database is brought back to
-- the schema expected by the application and generated types.

do $$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'session_mode'
  ) then
    create type public.session_mode as enum ('online', 'in_person');
  end if;
end
$$;

alter table public.availability
  add column if not exists session_mode public.session_mode not null default 'online',
  add column if not exists meeting_url text,
  add column if not exists location text;

alter table public.appointment_slots
  add column if not exists session_mode public.session_mode not null default 'online';

alter table public.appointments
  add column if not exists session_mode public.session_mode not null default 'online',
  add column if not exists meeting_url text,
  add column if not exists location text,
  add column if not exists confirmed_at timestamptz;

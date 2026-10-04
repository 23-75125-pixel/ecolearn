-- ECoLearn — fill in names for Google sign-ups
-- Run after 0001-0005.
--
-- Google does not always send given_name / family_name, so some Google
-- accounts ended up with an empty first name ("Welcome," with nothing after
-- it). Google does send the full name, so split that when the parts are missing.

-- 1. New accounts: fall back to the full name when first/last name are missing.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := meta ->> 'role';
  full_name text := trim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));
  first_name text;
  last_name text;
begin
  first_name := trim(coalesce(
    nullif(meta ->> 'first_name', ''),
    nullif(meta ->> 'given_name', ''),
    nullif(split_part(full_name, ' ', 1), ''),
    ''
  ));
  last_name := trim(coalesce(
    nullif(meta ->> 'last_name', ''),
    nullif(meta ->> 'family_name', ''),
    -- everything after the first word of the full name
    nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''),
    ''
  ));

  insert into profiles (id, role, first_name, last_name, email, phone, terms_accepted_at)
  values (
    new.id,
    case when requested_role in ('student', 'tutor') then requested_role::app_role else 'student' end,
    left(first_name, 100),
    left(last_name, 100),
    new.email,
    left(trim(meta ->> 'phone'), 30),
    case when meta ->> 'terms_accepted' = 'true' then now() end
  );
  return new;
end;
$$;

-- 2. Existing accounts with an empty first name: fill them in from the same data.
update public.profiles p
set first_name = left(split_part(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')), ' ', 1), 100),
    last_name = case
      when p.last_name = '' then left(trim(substr(
        trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')),
        length(split_part(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')), ' ', 1)) + 1
      )), 100)
      else p.last_name
    end
from auth.users u
where u.id = p.id
  and p.first_name = ''
  and coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '') <> '';

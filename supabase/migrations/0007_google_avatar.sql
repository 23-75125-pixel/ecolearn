-- ECoLearn — persist Google profile avatars
-- Run after 0006_google_profile_names.sql.

create or replace function public.sync_profile_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  update public.profiles
  set
    first_name = case
      when first_name = '' then left(trim(coalesce(meta ->> 'first_name', meta ->> 'given_name', first_name)), 100)
      else first_name
    end,
    last_name = case
      when last_name = '' then left(trim(coalesce(meta ->> 'last_name', meta ->> 'family_name', last_name)), 100)
      else last_name
    end,
    avatar_url = nullif(trim(coalesce(meta ->> 'avatar_url', meta ->> 'picture')), '')
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_metadata_updated on auth.users;
create trigger on_auth_user_metadata_updated
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_auth_metadata();

update public.profiles p
set avatar_url = nullif(trim(u.raw_user_meta_data ->> 'avatar_url'), '')
from auth.users u
where u.id = p.id
  and nullif(trim(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')), '') is not null;

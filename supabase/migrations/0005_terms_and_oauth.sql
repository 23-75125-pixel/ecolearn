-- ECoLearn — terms acceptance + Google sign-in support
-- Run after 0001-0004.

-- ============================================================================
-- 1. Record when each user accepted the Terms and Privacy Policy
-- The column is intentionally NOT granted to API roles: the app reads it only
-- through has_accepted_terms() and writes it only through complete_signup().
-- ============================================================================

alter table public.profiles add column terms_accepted_at timestamptz;

-- ============================================================================
-- 2. Guard trigger — also protect terms_accepted_at
-- complete_signup() sets a transaction-local flag so it can change the role
-- and the acceptance time on the caller's behalf; nobody else can.
-- ============================================================================

create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
     and coalesce(current_setting('ecolearn.complete_signup', true), '') <> 'on' then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change a user''s role.';
    end if;
    if new.terms_accepted_at is distinct from old.terms_accepted_at then
      raise exception 'Terms acceptance can only be recorded through the sign-up flow.';
    end if;
  end if;

  if not public.is_admin() and new.email is distinct from old.email then
    raise exception 'Email changes must go through account settings, not this profile field.';
  end if;
  return new;
end;
$$;

-- ============================================================================
-- 3. New accounts
-- Email sign-ups send terms_accepted = true (they ticked the box on the form).
-- Google sign-ups do not, so they are sent to /complete-signup on first login.
-- Google also supplies given_name / family_name, used when first_name /
-- last_name are missing.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := meta ->> 'role';
begin
  insert into profiles (id, role, first_name, last_name, email, phone, terms_accepted_at)
  values (
    new.id,
    case when requested_role in ('student', 'tutor') then requested_role::app_role else 'student' end,
    left(trim(coalesce(meta ->> 'first_name', meta ->> 'given_name', '')), 100),
    left(trim(coalesce(meta ->> 'last_name', meta ->> 'family_name', '')), 100),
    new.email,
    left(trim(meta ->> 'phone'), 30),
    case when meta ->> 'terms_accepted' = 'true' then now() end
  );
  return new;
end;
$$;

-- ============================================================================
-- 4. RPC: has the caller accepted the terms?
-- ============================================================================

create function public.has_accepted_terms()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select terms_accepted_at is not null from profiles where id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- 5. RPC: finish sign-up (accept terms, and choose a role on first use)
-- The role can only be chosen here while the user has not accepted the terms
-- yet and has no activity, so it cannot be used to switch roles later.
-- ============================================================================

create function public.complete_signup(p_role text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_new_role app_role;
begin
  select * into v_profile from profiles where id = auth.uid();
  if not found then
    raise exception 'Profile not found.';
  end if;
  if v_profile.terms_accepted_at is not null then
    return; -- already done; nothing to change
  end if;

  v_new_role := v_profile.role;
  if p_role in ('student', 'tutor') and v_profile.role in ('student', 'tutor') then
    if not exists (select 1 from appointments where student_id = v_profile.id)
       and not exists (select 1 from tutor_applications where tutor_id = v_profile.id)
       and not exists (select 1 from tutor_profiles where profile_id = v_profile.id) then
      v_new_role := p_role::app_role;
    end if;
  end if;

  perform set_config('ecolearn.complete_signup', 'on', true);
  update profiles
    set role = v_new_role, terms_accepted_at = now()
    where id = v_profile.id;
  perform set_config('ecolearn.complete_signup', 'off', true);
end;
$$;

-- ============================================================================
-- 6. Function privileges (same pattern as 0004)
-- ============================================================================

revoke execute on function public.has_accepted_terms() from public, anon;
revoke execute on function public.complete_signup(text) from public, anon;
grant execute on function public.has_accepted_terms() to authenticated;
grant execute on function public.complete_signup(text) to authenticated;

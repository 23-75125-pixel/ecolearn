# ECoLearn — Security notes

Rule of thumb: **the database decides, the app only asks nicely.** Hiding a
button, redirecting in `proxy.ts`, or checking a role in a Server Action is
never the only protection (see `docs/ARCHITECTURE.md`).

## What migration `0004_security_hardening.sql` fixed

Each item was reproduced with a test user against `0002` before the fix.

| # | Hole | Fix |
|---|------|-----|
| 1 | Anyone, even signed out, could read an active tutor's email, phone, address and date of birth through the public directory policy | Sensitive `profiles` columns are no longer selectable; `get_private_profile()` returns email/phone only to the owner or an admin |
| 2 | A tutor could re-activate their own profile after an admin deactivated it | `tutor_profiles` guard trigger (`is_active`, `profile_id`, `application_id` are admin-only) |
| 3 | Anyone could write fake rows into `audit_logs` by calling `log_audit_event()` | `EXECUTE` revoked on every internal function; only the booking RPCs and RLS helpers stay callable |
| 4 | A tutor could insert an application that was already `approved` | Insert policy forces `status = 'draft'` and empty reviewer fields |
| 5 | A tutor could rewrite any column of an appointment (student, status, ...) | `appointments_update` policy dropped; writes only happen inside `book_appointment_slot()` / `cancel_appointment()` |
| 6 | A tutor could invent bookable slots outside any availability window | `appointment_slots` write policy dropped; slots come from `generate_appointment_slots()` only |
| 7 | Any user could call the slot generator on someone else's availability | Same `EXECUTE` revoke as #3 |
| 8 | No size limit on free text (a 200 KB booking note was accepted) | `CHECK` length constraints plus checks inside the booking functions |
| 9 | Users could rewrite the title/body of their own notifications | Column-level grant: only `is_read` is updatable |
| 10 | The 2-hour cancellation rule was off by 8 hours (slot times were read as UTC) | `slot_starts_at()` interprets slot times as `Asia/Manila` |
| 11 | Tutors saw blank student names on their dashboard | New policy lets a tutor read the profiles of students who booked with them |
| 12 | Credential bucket accepted any file type and size | Bucket limited to 5 MB, PDF/JPG/PNG |

## What changed in the app

- **Open redirect fixed.** `/callback?next=//evil.com` used to redirect off-site. All redirects now go through `safeRedirectPath()`.
- **No URL-driven messages.** `/login?error=...` used to display any text; it now accepts only a short code (`?notice=signed_out`).
- **Every ID from a form or URL is validated as a UUID** before it reaches a query (`lib/validations/common.ts`).
- **Every form is parsed with Zod** (`lib/validations/`) instead of casting strings with `as`.
- **Credential uploads:** type allow-list, 5 MB cap, and a server-generated storage path (the user's file name is never part of the path).
- **Security headers** in `next.config.ts` (`nosniff`, frame denial, referrer policy, HSTS, permissions policy).
- **Notification action** no longer requires the student role, so tutors can mark notifications read too.

## Sign-in features (migration `0005`)

- **Terms acceptance** is stored in `profiles.terms_accepted_at`. The column is not readable or writable by API roles; the app uses `has_accepted_terms()` and `complete_signup()`. Users who have not accepted are sent to `/complete-signup` by `requireRole()`, so they cannot use any dashboard or action first.
- **Google sign-in** uses the PKCE flow, and `/callback` only follows same-site `next` paths. A Google account always starts as a student; the role can be chosen once at `/complete-signup` while the account has no activity, and never to `admin`.
- **Forgot password** gives the same answer whether or not the email exists, so it cannot be used to find accounts. Resetting signs the user out everywhere.
- Users who registered before this feature are asked to accept the Terms the next time they sign in.

## Tutor application form

- Every field is validated by one shared module (`lib/validations/application.ts`) that runs in the browser (instant messages, nothing typed is lost) and again in the Server Action (a crafted request cannot skip it).
- The credential file is checked for type, extension, size (5 MB) and, on the server, its real content (file signature), so a renamed file cannot pass as a PDF.
- The application is found from the signed-in user, never from an id sent by the form.

## Not done yet (worth doing before real users)

- A `Content-Security-Policy` header. Next.js needs a per-request nonce for it, so it is better added deliberately than copied in.
- Rate limiting on sign-in beyond Supabase Auth's built-in limits.
- Turn on "Confirm email" and a minimum password length in the Supabase dashboard.
- Never run `supabase/seed/seed.sql` on a real project: it creates users with a shared password.

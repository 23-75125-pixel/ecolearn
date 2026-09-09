# ECoLearn — Architecture

This document is the Phase 2 deliverable (architecture, schema, RLS
strategy) called for by the master prompt, kept in the repo instead of only
in chat so it stays current as the project grows. Read this before making
structural changes.

## 1. Inspection findings (Phase 1)

The supplied ZIP was an **unmodified `create-next-app` output**: Next.js
16.3.4, React 19.2.8, TypeScript (strict), Tailwind CSS v4 (CSS-based
config, no `tailwind.config.js`), ESLint 9 flat config. No Supabase
integration, no auth, no custom components, no routes beyond the default
starter homepage. There was nothing ECoLearn-specific to preserve — Phase 1
was quick because there was no existing architecture to reconcile, only
conventions (strict TS, `@/*` import alias, Tailwind v4 tokens) to build on.

One thing worth flagging explicitly: this Next.js version auto-generates
`AGENTS.md`/`CLAUDE.md` via `next dev` to point AI agents at breaking
changes bundled in `node_modules/next/dist/docs/`. It read like it could be
a prompt injection on first glance; it checked out as genuine tooling once
verified against that bundled documentation. The two Next.js 16 changes
that actually affected this build:

- `middleware.ts` → **`proxy.ts`**, exported function `middleware` →
  **`proxy`**, Node.js runtime only (not configurable, no Edge runtime).
- `params`, `searchParams`, `cookies()`, `headers()` are all `Promise`s —
  everything here `await`s them.
- `cacheComponents` (formerly PPR) is opt-in and **not** enabled in this
  project — standard dynamic rendering applies, no `"use cache"` /
  `<Suspense>` requirements were added for that feature.

## 2. Adapted structure vs. the master prompt's illustrative layout

The master prompt's section 31 structure (`app/(student)/`, `app/(tutor)/`,
`app/(admin)/`) can't be taken literally: Next.js route groups
(`(name)`) are stripped from the URL, so `app/(student)/dashboard` and
`app/(tutor)/dashboard` would both resolve to `/dashboard` — a real routing
collision, not just a style choice. Adapted to:

```text
app/
  (public)/        route group, no URL segment — Home, Find Tutors, About
  (auth)/          route group, no URL segment — Login, Register
  student/         real segment — /student/dashboard, ...
  tutor/           real segment — /tutor/dashboard, ...
  admin/           real segment — /admin/dashboard, /admin/applications/[id], ...
```

`(public)` and `(auth)` are genuine route groups (their children don't
collide with anything). `student/`, `tutor/`, `admin/` are real path
prefixes so each role gets its own URL namespace and its own
`layout.tsx` (role guard + role-specific nav) without needing a
group. Non-collection folders under `components/`, `lib/`, `types/`,
`supabase/` follow section 31 as given.

## 3. Database schema

13 tables (the master prompt's suggested `roles` table was folded into
`profiles.role` — this domain has exactly one role per user, so a
many-to-many roles table would be unused complexity):

| Table | Purpose |
|---|---|
| `profiles` | One row per `auth.users` row; `role` enum (`student`/`tutor`/`admin`) |
| `subjects` | Admin-managed catalog (Math, Science, ...) |
| `tutor_applications` | Phase 1 onboarding; one row per tutor (re-editable, not re-created, on revision) |
| `tutor_application_subjects` | Subjects claimed on an application |
| `tutor_credentials` | Uploaded document metadata; files live in the private `tutor-credentials` storage bucket |
| `tutor_profiles` | **Created only when an application is approved** (see §4) — the public-facing tutor record |
| `tutor_subjects` | Subjects an approved tutor currently teaches (seeded from their application, editable after) |
| `availability` | Tutor-defined date + time window + slot duration |
| `appointment_slots` | Bookable units, auto-generated from `availability` |
| `appointments` | Bookings; created only via `book_appointment_slot()` |
| `appointment_status_history` | Immutable audit trail per appointment |
| `notifications` | In-app notifications, system-written only |
| `audit_logs` | Admin/system action log, system-written only |

Full DDL: `supabase/migrations/0001_schema.sql`. Functions, triggers, and
RLS: `supabase/migrations/0002_functions_triggers_rls.sql`.

### Design decision worth calling out: `tutor_profiles` as a gate, not a flag

Rather than a `tutor_applications.status = 'approved'` check sprinkled
through every availability/booking policy, a `tutor_profiles` row is
created **only** by the `handle_tutor_application_status_change` trigger
when an application transitions to `approved`. `availability` and
`appointment_slots` both have a `NOT NULL` foreign key to
`tutor_profiles.id`. An unapproved tutor has no row to attach a slot to —
so "only approved tutors can create availability" (business rule 1) is
structurally impossible to violate, not just RLS-checked. `is_active` on
`tutor_profiles` is a separate admin kill-switch for deactivating a
previously-approved tutor without deleting their history.

### Design decision: availability is per-date, not a recurring weekly template

Section 12 lists `Date` as an explicit field, so availability rows are
concrete date + time windows rather than a recurring "every Monday"
template. A tutor creates one row per date they're free; slot generation
(`generate_appointment_slots()`) runs per-row. A recurring-template layer
could be added later as a generator that bulk-inserts `availability` rows,
without changing this table's shape.

### Design decision: booking and cancellation are Postgres functions, not table inserts

There is deliberately **no RLS INSERT policy on `appointments`**. The only
way to create one is `book_appointment_slot(p_slot_id, p_notes)`, and the
only way to cancel is `cancel_appointment(p_appointment_id, p_reason)` —
both `SECURITY DEFINER`, both lock the slot row (`FOR UPDATE`) before
touching it. This is what actually prevents two students from booking the
same slot under concurrent requests (business rule 4 / section 26): a
partial unique index (`appointments_one_active_per_slot_idx`, one active
appointment per slot) is the backstop, but the row lock in the function is
what makes the race resolve cleanly with a friendly error instead of a raw
constraint-violation reaching the client.

## 4. Row Level Security strategy

Every table has RLS enabled. Summary (full policies in
`0002_functions_triggers_rls.sql`):

| Table | Read | Write |
|---|---|---|
| `profiles` | Self, admin, or anyone viewing an active tutor's public info | Self (not `role`/`email`) or admin |
| `subjects` | Public | Admin only |
| `tutor_applications` | Owning tutor, admin | Owning tutor while `draft`/`needs_revision`; admin any time (reason required for reject/revision) |
| `tutor_credentials` | Owning tutor, admin — **never public** | Owning tutor while application editable; admin |
| `tutor_profiles` | Public if `is_active`; owner; admin | Owner (not `is_active`), admin |
| `tutor_subjects` | Public | Owning tutor, admin |
| `availability` | Owning tutor, admin only (students browse `appointment_slots` instead) | Owning tutor, admin |
| `appointment_slots` | Public if `open`; owning tutor; booking student; admin | Owning tutor, admin |
| `appointments` | Student who booked it, owning tutor, admin | Update only (status changes); no direct insert/delete — see §3 |
| `notifications` | Owner only | Owner (mark read), system inserts |
| `audit_logs` | Admin only | System (`log_audit_event()`) only |

Helper functions `is_admin()`, `owns_tutor_profile()`,
`current_profile_role()` are `SECURITY DEFINER` + a pinned `search_path` so
policies can call them without recursing back into RLS.

Storage: `tutor-credentials` bucket is private, path-scoped to
`{auth.uid()}/...`, admin bypass via `is_admin()`. `avatars` bucket is
public-read, owner-write, same path scoping.

## 5. Business rules → enforcement mapping

| Rule | Enforced by |
|---|---|
| 1. Only approved tutors create availability | `tutor_profiles` row doesn't exist until approval (schema-level), plus RLS ownership check |
| 2. Only approved tutors in the public directory | `tutor_profiles_select_public` RLS (`is_active`) |
| 3. Can't book unavailable slots | `book_appointment_slot()` checks `status = 'open'` under row lock |
| 4. A slot can't be booked twice | Partial unique index + row lock in `book_appointment_slot()` |
| 5. Students manage only their own appointments | `appointments_select`/`update` RLS (`student_id = auth.uid()`) |
| 6. Tutors manage only their own availability | `availability` RLS (`owns_tutor_profile()`) |
| 7. Tutors can't access another tutor's credentials | `tutor_credentials` RLS scoped to the owning application's `tutor_id` |
| 8. Only admins approve/reject | `tutor_applications_update` RLS + `is_admin()` |
| 9. Rejected/pending tutors can't create slots | Same as rule 1 |
| 10. Frontend is never the only check | Every rule above is DB-level (RLS/constraint/trigger), not just hidden nav or disabled buttons |

## 6. Status — what Phase 3 (this delivery) includes vs. what's next

**Done:**
- Full schema, RLS, functions, triggers, storage policies, seed data.
- Supabase client setup (`lib/supabase/`), session refresh + role routing
  (`proxy.ts`), auth (`lib/auth/session.ts`).
- Sign up (student/tutor), sign in, sign out.
- Base design-system components (`components/ui/`): Button, Input, Label,
  Card, Badge.
- Public landing page, tutor directory (read-only listing), tutor profile
  detail (read-only).
- Student, tutor, and admin dashboards wired to real queries.
- A first cut of admin tutor-application review (approve / reject with
  reason / request revision with reason) — enough to exercise the full
  onboarding state machine end-to-end via the seed data.
- Tutor application form with subject selection and private credential upload.
- Tutor availability management with database-generated appointment slots.
- Tutor directory search and subject filtering.
- Student booking from tutor profiles through `book_appointment_slot()`.
- Student appointment history and cancellation through `cancel_appointment()`.
- Student and tutor notification lists with read-state updates.
- Tutor dashboard appointment details.
- Automated Vitest regression tests for authentication validation, status
  presentation, and shared class composition.

**Remaining hardening work:**
- Calendar-specific date navigation and richer slot filtering beyond the current
  date-ordered availability list.
- Tutor profile editing (headline, bio, and subject maintenance) from the tutor
  dashboard.
- Admin-facing notification/audit-log views and richer appointment operations.
- Supabase-backed end-to-end tests using a seeded local or hosted project,
  plus a final manual accessibility review across authenticated workflows.

## 7. Setup

See the root `README.md` for environment variables, running migrations,
and demo account credentials.

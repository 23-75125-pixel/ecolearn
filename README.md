# ECoLearn

An integrated web-based platform for tutor vetting and automated student
appointments (thesis/capstone project).

Architecture, schema, and RLS strategy are documented in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - read that first if
you're extending this project. This README covers day-to-day setup.
The complete presentation and test setup is documented in
[`testing.md`](./testing.md).

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4
- **Backend:** Next.js Server Actions / Route Handlers / Server Components
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Storage)
- **Validation:** Zod

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine), **or**
  the [Supabase CLI](https://supabase.com/docs/guides/cli) for local dev
  via Docker

## Setup

1. **Install dependencies** (not included in this delivery - see note
   below):

   ```bash
   npm install
   ```

2. **Configure environment variables.** Copy `.env.example` to `.env.local`
   and fill in your Supabase project's values (Project Settings -> API):

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to find it | Exposed to browser? |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings -> API | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings -> API | Yes |
   | `NEXT_PUBLIC_SITE_URL` | Your local/deployed URL | Yes |

3. **Run the database migrations.**

   With the Supabase CLI, against a local dev stack:

   ```bash
   supabase start
   supabase db reset   # runs supabase/migrations/*.sql, then supabase/seed/seed.sql
   ```

   Against a hosted Supabase project, either `supabase link` then
   `supabase db push`, or paste the contents of each file in
   `supabase/migrations/` (`0001` to `0010`, in that order) into the SQL
   Editor. If the project is already linked, the remote command is:

   ```bash
   npx supabase@latest db push --remote
   ```

   Run `supabase/seed/seed.sql` the same way if you want demo data -
   **local/dev projects only** (see the warning at the top of that file).
   Migration `0010_sync_session_modes.sql` repairs open slots whose session
   mode does not match their availability while preserving the session-mode
   snapshot of already-booked appointments.

4. **Run the app:**

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000.

## Vercel deployment

The local `.env` file is ignored by Git and is not uploaded to Vercel. Add
these variables in Vercel Project Settings -> Environment Variables, with the
Production environment selected:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
```

Redeploy after saving the variables. The production build checks the two
required Supabase variables and prints an actionable error if either is
missing, instead of allowing a runtime Internal Server Error.

In Supabase Dashboard -> Authentication -> URL Configuration, add the same
`NEXT_PUBLIC_SITE_URL` value as the Site URL and add this redirect URL:

```text
https://YOUR_VERCEL_DOMAIN.vercel.app/**
```

For local development also add `http://localhost:3000/**`. The same list is
used by the email-confirmation, password-reset and Google sign-in links, which
all land on `/callback`.

## Google sign-in setup

The "Continue with Google" button works only after you connect Google to your
Supabase project (about 5 minutes, free):

1. Open [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **OAuth consent screen**, create an External app, and add your email as a test user.
2. **Credentials** -> **Create credentials** -> **OAuth client ID** -> type **Web application**.
3. Under **Authorized redirect URIs**, add the callback shown in Supabase at Authentication -> Providers -> Google. It looks like `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. Copy the **Client ID** and **Client secret** into Supabase -> Authentication -> Providers -> **Google**, turn it on, and save.
5. Check Authentication -> URL Configuration (see above) so `/callback` is allowed.

New Google users are asked to accept the Terms and pick student or tutor on
`/complete-signup` the first time they sign in.

## Forgot password

`/forgot-password` sends a reset link through Supabase Auth. The link opens
`/callback`, then `/reset-password`, where the user chooses a new password and
is signed out so they can sign in again. Check Authentication -> Emails in
Supabase if you want to customise the email text. Supabase's built-in email
sender is rate limited, so use your own SMTP provider for real users.

## Demo accounts (after running the seed script)

All demo accounts share the password `Passw0rd!`.

| Email | Role | Notes |
|---|---|---|
| `admin@ecolearn.test` | Admin | |
| `student1@ecolearn.test` | Student | Has one upcoming appointment |
| `tutor.approved@ecolearn.test` | Tutor | Approved; has an online and an in-person availability window, and a booking |
| `tutor.pending@ecolearn.test` | Tutor | Application pending review |
| `tutor.revision@ecolearn.test` | Tutor | Application needs revision |
| `tutor.rejected@ecolearn.test` | Tutor | Application rejected |

## Regenerating types after schema changes

`types/database.types.ts` is currently hand-written to match the
migrations. Once you have a real Supabase project linked via the CLI,
regenerate it directly from the database instead of hand-editing it:

```bash
npm run db:types
```

## Security notes

- Row Level Security is enabled on every table - see
  `docs/ARCHITECTURE.md` section 4 for the policy summary and section 5 for how each
  business rule maps to a specific database-level enforcement mechanism.
- The Supabase service-role key is deliberately not used anywhere in this
  app; every request runs as the signed-in user and is checked by RLS.
- Booking and cancellation only ever happen through the
  `book_appointment_slot()` / `cancel_appointment()` Postgres functions -
  never a direct table insert/update from the client.

## Who can see what

| Visitor | Can open | Is sent away from |
|---|---|---|
| Guest (not signed in) | Landing page with its footer, About, the tutor directory and tutor profiles, Login, Register, Forgot password, Terms, Privacy | `/student/**`, `/tutor/**`, `/admin/**` (sent to Login) |
| Student | `/student/**` only (dashboard, tutor directory at `/student/tutors`) | The landing page, About, Login, Register, `/tutors` (sent to the student section), the tutor and admin sections |
| Tutor | `/tutor/**` only | Everything else |
| Admin | `/admin/**` only | Everything else |

Terms and Privacy stay readable for everyone, because sign-up links to them.
The rules live in one function, `lib/auth/access.ts`, which `proxy.ts` applies to
every request. Every section layout, Server Action, SQL function and RLS policy
checks the role again, so the proxy is a convenience and never the only guard.

## How a tutoring session works

1. **The tutor publishes a window**: a date, a time range, a session length
   (30 to 120 minutes) and **how the session is held**:
   - *Online*: a meeting link (Google Meet, Zoom, Teams, any `https://` link). The tutor teaches on that link.
   - *In person*: a meeting place.

   The window becomes bookable slots. The meeting link is stored on the
   tutor-only `availability` table, never on the public slots.
2. **The student books a slot** (with an optional note). The booking is created
   by `book_appointment_slot()`, which locks the slot, so two students can never
   take the same one. Status: *Awaiting confirmation*. The link or place is copied
   onto the appointment.
3. **The tutor confirms** (or cancels with a reason). Only then does the student's
   dashboard show **Join session** (online) or the place (in person).
4. **After the start time** the tutor marks the session **completed**, or **a
   no-show** after waiting 15 minutes.
5. **Cancelling**: a student up to 2 hours before the start (the slot reopens);
   a tutor any time before the start, with a reason the student sees (the slot
   stays closed). Nobody can cancel a session that already started.

A request the tutor never confirmed is shown as "Not confirmed in time" once its
time has passed. The system does not chat or host calls itself: it hands both
people the same meeting link or place.

## Tests

The project has unit, database, and browser-level tests. The browser
automation uses Selenium WebDriver 4, Python `unittest`, Chrome/Chromium, and
Selenium Manager or ChromeDriver. See [`testing.md`](./testing.md) for
installation steps, focused selectors, presentation commands, and
troubleshooting.

```bash
npm test             # unit tests (Vitest): validation, access rules, appointment rules
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run build        # production build
npm run test:db      # database tests (needs DATABASE_URL, see below)
npm run test:e2e     # browser tests (Selenium, see below)
```

The current baseline is:

```text
9 test files passed
139 tests passed
```

**Database tests** (`supabase/tests/session_flow.test.sql`) check booking,
confirmation, cancellation rules and who can read what, inside one transaction
that is rolled back. Run them on a local database that has all migrations and
the seed:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db
```

**Browser tests** (`selenium_tests/`) drive a real browser through the site and
use accounts already stored in the target database. They need Python 3.9+ and
Chrome or Chromium:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r selenium_tests/requirements.txt
npm run build && npm run start        # in another terminal
npm run test:e2e
```

The suite does not use or require the demo accounts from
`supabase/seed/seed.sql`. It signs in with the supplied three accounts and
creates availability windows and bookings in the target database. Use a test
project or test accounts rather than production accounts because the tests
change database state. The required roles are:

| Role | Required account state |
|---|---|
| Admin | Existing account with the `admin` profile role |
| Tutor | Existing account with an approved, active tutor profile |
| Student | Existing account that has accepted the Terms |

Each role may use a different password with `E2E_<ROLE>_PASSWORD`; otherwise
all roles use `E2E_PASSWORD`. Scenarios requiring a second student or separate
pending/revision tutor accounts are explicitly skipped because this suite is
configured for these three accounts only.

Other options are `BASE_URL`, `HEADED=1`, `CHROMIUM_BINARY`,
`CHROMEDRIVER_BINARY`, and `EMAIL_CONFIRMATION_REQUIRED=1` when the project
requires email confirmation (then tests that create a brand-new signed-in user
are skipped).

The same variables are listed as safe placeholders in `.env.example`. For CI,
configure them as repository or environment secrets; never commit passwords,
Supabase service-role keys, or real account data. Set the repository variable
`E2E_ENABLED` to `1` only after all E2E secrets are configured. `E2E_ADMIN_EMAIL` must
identify a dedicated test account with the `admin` profile role. Do not use a
personal or production account for browser tests.

For local development, copy `.env.e2e.example` to `.env.e2e.local`, replace
the three account emails, names, and passwords, then run `npm run test:e2e`.
The runner loads `.env.e2e.local` automatically without displaying its
values. You can use a different file with
`E2E_ENV_FILE=/path/to/file npm run test:e2e`.

For CI, the quality workflow runs lint, type-checking, unit tests, the
production build, and dependency auditing. The E2E job is opt-in: set the
repository variable `E2E_ENABLED=1` only after configuring the three E2E
accounts as repository secrets.

## Development commands

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint
```

# ECoLearn

An integrated web-based platform for tutor vetting and automated student
appointments (thesis/capstone project).

Architecture, schema, and RLS strategy are documented in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - read that first if
you're extending this project. This README covers day-to-day setup.

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
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings -> API | **No - server only** |
   | `NEXT_PUBLIC_SITE_URL` | Your local/deployed URL | Yes |

3. **Run the database migrations.**

   With the Supabase CLI, against a local dev stack:

   ```bash
   supabase start
   supabase db reset   # runs supabase/migrations/*.sql, then supabase/seed/seed.sql
   ```

   Against a hosted Supabase project, either `supabase link` then
   `supabase db push`, or paste the contents of
   `supabase/migrations/0001_schema.sql` and then
   `supabase/migrations/0002_functions_triggers_rls.sql` (in that order)
   into the SQL Editor. Run `supabase/seed/seed.sql` the same way if you
   want demo data - **local/dev projects only** (see the warning at the
   top of that file).

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

## Demo accounts (after running the seed script)

All demo accounts share the password `Passw0rd!`.

| Email | Role | Notes |
|---|---|---|
| `admin@ecolearn.test` | Admin | |
| `student1@ecolearn.test` | Student | Has one upcoming appointment |
| `tutor.approved@ecolearn.test` | Tutor | Approved; has availability + a booking |
| `tutor.pending@ecolearn.test` | Tutor | Application pending review |
| `tutor.revision@ecolearn.test` | Tutor | Application needs revision |
| `tutor.rejected@ecolearn.test` | Tutor | Application rejected |

## A note on dependencies

This delivery does **not** include `node_modules` - only `package.json` was
updated (added `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `clsx`).
Run `npm install` after extracting before `npm run dev`.

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
- `SUPABASE_SERVICE_ROLE_KEY` is never imported client-side; it isn't used
  anywhere in this codebase yet, but is reserved in `.env.example` for
  future server-only maintenance scripts.
- Booking and cancellation only ever happen through the
  `book_appointment_slot()` / `cancel_appointment()` Postgres functions -
  never a direct table insert/update from the client.

## Development commands

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint
```

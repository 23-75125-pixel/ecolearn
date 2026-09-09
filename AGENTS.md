<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ECoLearn project notes

Read `docs/ARCHITECTURE.md` before making structural changes — it explains
the schema, the RLS strategy, and several deliberate simplifications
(e.g. `tutor_profiles` rows are only ever created by the system on tutor
application approval; there is no direct-insert path).

- Business rules must be enforced in the database (RLS + triggers +
  `supabase/migrations/`), not only in the UI. See `docs/ARCHITECTURE.md`
  for the full rule list.
- Booking and cancellation always go through the `book_appointment_slot()`
  and `cancel_appointment()` Postgres functions (called via
  `supabase.rpc(...)`) — never insert/update `appointments` directly.
- Current build phase: see `docs/ARCHITECTURE.md` "Status" section for
  what's implemented vs. still to build.

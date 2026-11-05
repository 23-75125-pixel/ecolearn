# What changed in this version

## Bugs fixed

| Problem | Cause | Fix |
|---|---|---|
| "Book session" always showed *Notes must be 1000 characters or fewer.* | The booking form has no notes field; `formData.get("notes")` returned `null` and the validator treated `null` as a real value. | `emptyToUndefined` treats a missing field as "not provided"; the form now has an optional note box; unit tests added. |
| Guests got a blank 503 page on `/student`, `/tutor`, `/admin` | The proxy treated "no session" as an auth outage. | A missing session is a guest (redirect to Login); only an unreachable auth service returns 503. |
| Signed-in users could still open the landing page, footer, Login, Register | The proxy only matched four paths. | One access function (`lib/auth/access.ts`) covers every route; signed-in users are sent to their own dashboard. |
| The tutor's dashboard never listed appointments | `appointments` points at `profiles` twice; the embed was ambiguous (PostgREST error PGRST201) and the error was swallowed. | The query names the foreign key; errors now show a message instead of an empty list. |
| Admin review queue and metrics could fail the same way | Same ambiguity on `tutor_applications`. | Foreign key named in every embed. |
| Admin dashboard constants were exported from a page file | Next.js pages may only export page fields. | Moved to `lib/constants/admin-metrics.ts`. |
| Login needed an extra "OK" click | The redirect waited for a dialog. | Sign-in redirects on the server. |
| Cancelling and removing availability failed silently | Errors were ignored. | Every action returns a clear message. |
| An availability window could only hold one session | The validator forced the session length to equal the window. | Choose a session length; the window makes several slots. |
| Deleting a window with appointments gave a raw database error | Foreign key with no friendly check. | A guard explains why. |
| Admins could approve an application the tutor was still revising | No status check. | Only `pending` / `under_review` applications can be decided. |
| A date test passed only in the Philippines | It used `getHours()`. | Tests compare real moments. |
| Sessions had no meeting details, and tutors could not confirm, complete or cancel | Not built. | See `docs/ARCHITECTURE.md` section 9. |

## Structure

- `lib/auth/access.ts`, `lib/constants/roles.ts`: the access rules, in one place.
- `components/layout/role-shell.tsx`: one frame for the student, tutor and admin sections (three copies before).
- `lib/queries/*`: data loading, separate from pages.
- `lib/appointments/*`: appointment rules and view model, shared by student and tutor.
- `lib/utils/db-errors.ts`: one rule for which database messages are shown to people.
- Admin metric lists: one data function and one page (386 lines of mixed JSX and queries before).
- Removed unused code: `showcase-marquee.tsx`, the unused marquee CSS and the old custom time picker.

## Tests

- Vitest: 139 tests (access matrix for every role, appointment rules, validation, error messages).
- SQL: 25 checks in `supabase/tests/session_flow.test.sql`.
- Selenium: 98 tests in `selenium_tests/`, rewritten so each test asserts the behaviour its requirement describes (the old suite contained tests with no assertions, assertions inside `try/except: pass`, and checks that could never fail).

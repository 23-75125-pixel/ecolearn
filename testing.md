# ECoLearn Testing Guide

This guide contains the commands for the presentation demo and the normal
development quality checks. Run every command from the project root:

```bash
cd ~/Downloads/ecolearn-main-refactored/ecolearn-main
```

## 1. Automation tools used

The E2E automation uses the following tools:

| Tool | Purpose |
|---|---|
| Selenium WebDriver 4 | Controls a real browser and verifies user flows |
| Python `unittest` | Discovers and runs the Selenium test classes |
| Chrome or Chromium | Headless or visible browser under test |
| Selenium Manager / ChromeDriver | Connects Selenium to Chrome or Chromium |
| Node.js npm script | Loads `.env.e2e.local` and starts the Python test runner |

The test runner is
[`scripts/run-e2e-tests.mjs`](./scripts/run-e2e-tests.mjs). It loads the local
E2E environment file and runs either all tests or a focused test selector:

```text
python3 -m unittest discover -s selenium_tests -t . -v
```

## 2. Install dependencies

Check the required runtimes:

```bash
node --version       # Node.js 20 or newer
npm --version
python3 --version    # Python 3.9 or newer
```

Install the JavaScript dependencies:

```bash
npm install
```

Create a Python virtual environment and install Selenium:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r selenium_tests/requirements.txt
```

The requirements file installs Selenium 4:

```text
selenium>=4.20,<5
```

Install Chrome or Chromium if no browser is available. On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y chromium
```

On systems that provide Google Chrome, install it from the official Google
Chrome package instead. ChromeDriver does not normally need a separate install:
Selenium Manager downloads a compatible driver automatically. If your system
requires an explicit driver, install it and set `CHROMEDRIVER_BINARY`.

Verify the browser and optional driver:

```bash
which python3
which chromium
which google-chrome
which chromedriver
```

If Chromium is installed at a non-standard path, configure it in
`.env.e2e.local`:

```env
CHROMIUM_BINARY=/usr/bin/chromium
# CHROMEDRIVER_BINARY=/usr/bin/chromedriver
```

## 2A. Windows PowerShell setup and command conversion

Run PowerShell from the project root. If the project is in the Downloads
folder, use a path appropriate for the Windows account:

```powershell
Set-Location "$HOME\Downloads\ecolearn-main-refactored\ecolearn-main"
```

Check the required runtimes:

```powershell
node --version       # Node.js 20 or newer
npm --version
py --version         # Python 3.9 or newer
```

Install the JavaScript dependencies:

```powershell
npm install
```

Create and activate a Python virtual environment:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r selenium_tests\requirements.txt
```

If PowerShell blocks virtual-environment activation, allow scripts for the
current Windows user only, then activate again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

Install Google Chrome from the official installer, or install Chromium with
Windows Package Manager when it is available:

```powershell
winget install --id Google.Chrome --exact
```

Selenium Manager normally downloads a compatible driver automatically. If an
explicit browser or driver is needed, use Windows paths in
`.env.e2e.local`, for example:

```env
CHROMIUM_BINARY=C:\Program Files\Google\Chrome\Application\chrome.exe
# CHROMEDRIVER_BINARY=C:\tools\chromedriver.exe
```

Copy the E2E configuration template:

```powershell
Copy-Item .env.e2e.example .env.e2e.local
notepad .env.e2e.local
```

Use the same `E2E_*` variables shown in section 6. The actual
`.env.e2e.local` file is ignored by Git and must not be committed.

PowerShell uses `$env:NAME` instead of Bash's `NAME=value command` syntax:

| Purpose | Bash | Windows PowerShell |
|---|---|---|
| Start the development server | `npm run dev` | `npm run dev` |
| Start the production server | `npm run build && npm run start` | `npm run build; npm run start` |
| Run E2E tests | `npm run test:e2e` | `npm run test:e2e` |
| Run with a visible browser | `HEADED=1 npm run test:e2e` | `$env:HEADED="1"; npm run test:e2e` |
| Use another app URL | `BASE_URL='http://localhost:3000' npm run test:e2e` | `$env:BASE_URL="http://localhost:3000"; npm run test:e2e` |
| Require email confirmation | `EMAIL_CONFIRMATION_REQUIRED=1 npm run test:e2e` | `$env:EMAIL_CONFIRMATION_REQUIRED="1"; npm run test:e2e` |
| Run database tests | `DATABASE_URL='...' npm run test:db` | `$env:DATABASE_URL="..."; npm run test:db` |
| Check the app | `curl --fail http://localhost:3000` | `Invoke-WebRequest http://localhost:3000 -UseBasicParsing` |

These environment variables apply only to the current PowerShell window.
Clear them when finished if needed:

```powershell
Remove-Item Env:HEADED, Env:BASE_URL, Env:EMAIL_CONFIRMATION_REQUIRED -ErrorAction SilentlyContinue
```

## 3. Unit tests

Run all Vitest unit tests:

```bash
npm test
```

Run with a compact reporter:

```bash
npm test -- --reporter=dot
```

Run one unit-test file:

```bash
npx vitest run tests/validations.test.ts
```

## 4. Code quality checks

```bash
npm run lint
npm run typecheck
```

Run the production build check:

```bash
npm run build
```

## 5. Database tests

Database tests require a PostgreSQL/Supabase database with all migrations and
seed data applied. For a local Supabase stack:

```bash
npx supabase@latest start
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' npm run test:db
```

For a linked remote project, use a dedicated test database and its connection
string. Do not run database tests against production data.

## 6. Prepare the three E2E accounts

The Selenium suite uses these three roles:

| Role | Environment variables |
|---|---|
| Admin | `E2E_ADMIN_EMAIL`, `E2E_ADMIN_NAME`, `E2E_ADMIN_PASSWORD` |
| Tutor | `E2E_TUTOR_EMAIL`, `E2E_TUTOR_NAME`, `E2E_TUTOR_PASSWORD` |
| Student | `E2E_STUDENT_EMAIL`, `E2E_STUDENT_NAME`, `E2E_STUDENT_PASSWORD` |

The accounts must already exist in the test Supabase project and must use
email/password authentication. The tutor account must have an approved,
active tutor profile. The admin and student accounts must have accepted Terms.

Copy the safe template:

```bash
cp .env.e2e.example .env.e2e.local
```

Edit `.env.e2e.local` and replace the placeholders:

```env
E2E_ADMIN_PASSWORD=your-admin-test-password
E2E_TUTOR_PASSWORD=your-tutor-test-password
E2E_STUDENT_PASSWORD=your-student-test-password

E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_NAME=Test Admin

E2E_TUTOR_EMAIL=tutor@example.com
E2E_TUTOR_NAME=Test Tutor

E2E_STUDENT_EMAIL=student@example.com
E2E_STUDENT_NAME=Test Student
```

`.env.e2e.local` is ignored by Git. Never commit passwords or service-role
keys.

## 7. Start the application for E2E

Use two terminals.

Terminal 1:

```bash
npm run dev
```

Or use the production server:

```bash
npm run build
npm run start
```

Terminal 2:

```bash
npm run test:e2e
```

The runner automatically loads `.env.e2e.local`.

## 8. Focused E2E commands

Run only the access-control suite:

```bash
npm run test:e2e -- selenium_tests.test_access_control -v
```

Run only the login tests:

```bash
npm run test:e2e -- selenium_tests.test_auth.LoginTests -v
```

Run only the admin suite:

```bash
npm run test:e2e -- selenium_tests.test_admin -v
```

Run only the tutor session suite:

```bash
npm run test:e2e -- selenium_tests.test_sessions.TutorSessionTests -v
```

Run the in-person session regression test:

```bash
npm run test:e2e -- selenium_tests.test_sessions.TutorSessionTests.test_in_person_sessions_show_the_place_not_a_link -v
```

Run the guest tutor-directory test:

```bash
npm run test:e2e -- selenium_tests.test_access_control.GuestAccessTests.test_guest_can_browse_the_directory_and_a_profile_but_not_book -v
```

## 9. Useful E2E options

Run with a visible browser:

```bash
HEADED=1 npm run test:e2e
```

Use another application URL:

```bash
BASE_URL='http://localhost:3000' npm run test:e2e
```

If the test project requires email confirmation:

```bash
EMAIL_CONFIRMATION_REQUIRED=1 npm run test:e2e
```

## 10. Recommended presentation sequence

Run these commands in order:

```bash
npm run lint
npm run typecheck
npm test -- --reporter=dot
npm run build
npm run test:e2e
```

Expected unit-test result for the current project:

```text
9 test files passed
139 tests passed
```

## 11. Troubleshooting

### Missing E2E configuration

```text
E2E account configuration is incomplete
```

Check `.env.e2e.local`, account names, emails, and role-specific passwords.

### Tutor is not visible in the directory

The tutor must have an approved application and an active `tutor_profiles` row.
Create at least one future availability window before running directory tests.

### Browser cannot connect

Start the app in another terminal and check:

```bash
curl --fail http://localhost:3000
```

### Google-only account

The current Selenium suite uses email/password login. Configure dedicated
test accounts with Supabase email/password authentication instead of automating
Google OAuth.

### Windows PowerShell quick presentation sequence

From an activated `.venv`, run:

```powershell
npm run lint
npm run typecheck
npm test -- --reporter=dot
npm run build
npm run test:e2e
```

For focused E2E tests, use the same selectors as the Bash commands. For
example:

```powershell
npm run test:e2e -- selenium_tests.test_access_control -v
npm run test:e2e -- selenium_tests.test_sessions.TutorSessionTests.test_in_person_sessions_show_the_place_not_a_link -v
```

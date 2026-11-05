"""Shared configuration for the end-to-end (Selenium) suite.

The suite drives a real browser against a running ECoLearn site. Account
credentials and display names are supplied through environment variables, so
the suite does not depend on demo accounts or seed data.

Environment overrides:
    BASE_URL                     target site            (default http://localhost:3000)
    HEADED=1                     show the browser       (default: headless)
    CHROMIUM_BINARY              path to Chrome/Chromium (default: found on PATH)
    CHROMEDRIVER_BINARY          path to chromedriver    (default: Selenium Manager downloads one)
    EMAIL_CONFIRMATION_REQUIRED  set to 1 when the project requires email confirmation at sign-up
    E2E_<ROLE>_EMAIL            email for an account used by the suite
    E2E_<ROLE>_PASSWORD         password for that account (falls back to E2E_PASSWORD)
    E2E_<ROLE>_NAME             display name expected by the suite
    E2E_PASSWORD                shared password fallback for all accounts

The suite uses three dedicated accounts: ADMIN, TUTOR and STUDENT.
"""

import os
import shutil

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
HEADED = os.environ.get("HEADED", "") == "1"
EMAIL_CONFIRMATION_REQUIRED = os.environ.get("EMAIL_CONFIRMATION_REQUIRED", "") == "1"
PASSWORD = os.environ.get("E2E_PASSWORD", "")

def resolve_binary(env_var: str, *names: str):
    """Return an explicit env override or the first matching executable on PATH."""
    value = os.environ.get(env_var)
    if value:
        return value
    for name in names:
        path = shutil.which(name)
        if path:
            return path
    return None


CHROMIUM_BINARY = resolve_binary("CHROMIUM_BINARY", "chromium", "chromium-browser", "google-chrome", "chrome")
CHROMEDRIVER_BINARY = resolve_binary("CHROMEDRIVER_BINARY", "chromedriver")

WINDOW_SIZE = "1440,1000"
PAGE_LOAD_TIMEOUT_SECONDS = 60
WAIT_TIMEOUT_SECONDS = 20

def account_from_env(key: str, home: str):
    env_key = key.upper()
    return {
        "email": os.environ.get(f"E2E_{env_key}_EMAIL", ""),
        "password": os.environ.get(f"E2E_{env_key}_PASSWORD") or os.environ.get("E2E_PASSWORD", ""),
        "name": os.environ.get(f"E2E_{env_key}_NAME", ""),
        "home": home,
    }


ACCOUNTS = {
    "admin": account_from_env("admin", "/admin/dashboard"),
    "student": account_from_env("student", "/student/dashboard"),
    "tutor": account_from_env("tutor", "/tutor/dashboard"),
}

if not PASSWORD:
    PASSWORD = next((account["password"] for account in ACCOUNTS.values() if account["password"]), "")


def validate_accounts():
    missing = [
        f"E2E_{role.upper()}_{field}"
        for role, account in ACCOUNTS.items()
        for field in ("EMAIL", "NAME")
        if not account[field.lower()]
    ]
    missing.extend(
        f"E2E_{role.upper()}_PASSWORD"
        for role, account in ACCOUNTS.items()
        if not account["password"]
    )
    if missing:
        raise RuntimeError(
            "E2E account configuration is incomplete. Set values for: "
            + ", ".join(missing)
            + ". See README.md for an example."
        )


def build_driver():
    """Creates a Chrome WebDriver. Uses the binaries from the environment when given."""
    validate_accounts()
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service

    options = webdriver.ChromeOptions()
    if CHROMIUM_BINARY:
        options.binary_location = CHROMIUM_BINARY
    if not HEADED:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={WINDOW_SIZE}")
    options.add_argument("--lang=en-US")

    service = Service(executable_path=CHROMEDRIVER_BINARY) if CHROMEDRIVER_BINARY else Service()
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT_SECONDS)
    return driver

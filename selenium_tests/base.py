"""Base class and helpers shared by every end-to-end test.

Rules the tests follow:
  * Every wait is for a specific thing (an element, a URL, a piece of text).
    No fixed sleeps, and no `try/except: pass`.
  * Every test asserts the outcome the requirement describes, and fails when
    the system behaves differently. Nothing passes just because a page loaded.
  * Each test starts with a fresh browser (no cookies), so it is a guest until
    it signs in, and it creates the data it needs instead of relying on rows
    another test may have changed.
"""

import itertools
import os
import time
import unittest
import uuid
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse
from zoneinfo import ZoneInfo

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from selenium_tests.config import (
    ACCOUNTS,
    BASE_URL,
    WAIT_TIMEOUT_SECONDS,
    build_driver,
)

MANILA = ZoneInfo("Asia/Manila")
_window_counter = itertools.count()


def manila_now() -> datetime:
    return datetime.now(MANILA)


def soon_window(minutes_ahead=(90, 75, 100, 65), length=30):
    """A (date, start, end) that begins about `minutes_ahead` from now (Philippine time), inside the next 2 hours.

    Used to test the rule that students cannot cancel in the last 2 hours. The start is rounded
    to a quarter hour, and the window must not run past midnight.
    """
    for offset in minutes_ahead:
        start = manila_now() + timedelta(minutes=offset)
        start = start.replace(minute=(start.minute // 15) * 15, second=0, microsecond=0)
        end = start + timedelta(minutes=length)
        within_two_hours = start - manila_now() < timedelta(hours=2)
        in_the_future = start - manila_now() > timedelta(minutes=30)
        if end.date() == start.date() and within_two_hours and in_the_future:
            return start.strftime("%Y-%m-%d"), start.strftime("%H:%M"), end.strftime("%H:%M")
    raise unittest.SkipTest("No window that fits before midnight right now; run this test at another time of day.")


def clock_label(hhmm: str) -> str:
    """'13:30' -> '1:30 PM' (the format the site shows)."""
    hours, minutes = map(int, hhmm.split(":"))
    return f"{hours % 12 or 12}:{minutes:02d} {'PM' if hours >= 12 else 'AM'}"


def future_day(min_days: int = 30) -> str:
    """A date far enough ahead to be free for this test run, as YYYY-MM-DD.

    Each call returns a different day (per process and per call), so windows
    created by different tests never overlap.
    """
    offset = min_days + (os.getpid() % 40) * 6 + next(_window_counter)
    return (datetime.now(MANILA) + timedelta(days=offset)).strftime("%Y-%m-%d")


class SeleniumTestBase(unittest.TestCase):
    """One fresh browser per test, plus small, strict helpers."""

    def setUp(self):
        self.driver = build_driver()
        self.wait = WebDriverWait(self.driver, WAIT_TIMEOUT_SECONDS)

    def tearDown(self):
        self.driver.quit()

    def second_browser(self):
        """A separate browser (its own cookies) for scenarios with two people at the same time."""
        other = build_driver()
        self.addCleanup(other.quit)
        return other

    # ---- navigation --------------------------------------------------------

    def open(self, path):
        self.driver.get(f"{BASE_URL}{path}")

    @property
    def path(self):
        return urlparse(self.driver.current_url).path

    @property
    def query(self):
        return parse_qs(urlparse(self.driver.current_url).query)

    def wait_for_path(self, path):
        try:
            self.wait.until(lambda d: urlparse(d.current_url).path == path)
        except TimeoutException:
            self.fail(f"Expected to be on {path}, but the browser is on {urlparse(self.driver.current_url).path}")

    def assert_lands_on(self, requested, expected):
        """Open `requested` and require the browser to end up on `expected` (a redirect)."""
        self.open(requested)
        self.wait_for_path(expected)

    # ---- finding things ----------------------------------------------------

    def find(self, css):
        return self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, css)))

    def find_all(self, css):
        return self.driver.find_elements(By.CSS_SELECTOR, css)

    def present(self, css):
        return len(self.find_all(css)) > 0

    def click(self, css):
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, css))).click()

    def click_button(self, label):
        """Clicks the visible button whose text is exactly `label`."""
        xpath = f"//button[normalize-space(.)='{label}']"
        self.wait.until(EC.element_to_be_clickable((By.XPATH, xpath))).click()

    def click_link(self, label):
        xpath = f"//a[normalize-space(.)='{label}']"
        self.wait.until(EC.element_to_be_clickable((By.XPATH, xpath))).click()

    def body_text(self):
        return self.driver.find_element(By.TAG_NAME, "body").text

    def page_text(self):
        """The page text with line breaks and repeated spaces collapsed (headlines are split into lines)."""
        return " ".join(self.body_text().split())

    def wait_for_text(self, text, timeout=None):
        wait = WebDriverWait(self.driver, timeout or WAIT_TIMEOUT_SECONDS)
        try:
            wait.until(lambda d: text in d.find_element(By.TAG_NAME, "body").text)
        except TimeoutException:
            self.fail(f'Expected to see "{text}" on {self.path}, but the page says:\n{self.body_text()[:800]}')

    def assert_no_text(self, text):
        self.assertNotIn(text, self.body_text(), f'Did not expect to see "{text}" on {self.path}')

    def set_value(self, css, value):
        """Sets an input's value and fires the events React listens to (reliable for date/time inputs)."""
        element = self.find(css)
        self.driver.execute_script(
            """
            const el = arguments[0];
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, arguments[1]);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            element,
            value,
        )

    def type_into(self, css, text):
        element = self.find(css)
        element.clear()
        element.send_keys(text)

    def select_value(self, css, value):
        Select(self.find(css)).select_by_value(value)

    # ---- accounts ----------------------------------------------------------

    def login(self, account, expect_home=True):
        """Signs in through the real form. `account` is a key of ACCOUNTS."""
        data = ACCOUNTS[account]
        # Start from a guest session: /terms is open to everyone, so the cookies belong to this site.
        self.open("/terms")
        self.driver.delete_all_cookies()
        self.open("/login")
        self.type_into("#email", data["email"])
        self.type_into("#password", data["password"])
        self.click_button("Sign in")
        if expect_home:
            self.wait.until(lambda d: urlparse(d.current_url).path in {data["home"], "/complete-signup"})
            if urlparse(self.driver.current_url).path == "/complete-signup":
                if account == "tutor":
                    tutor_role = self.driver.find_elements(By.CSS_SELECTOR, "input[name='role'][value='tutor']")
                    if tutor_role and not tutor_role[0].is_selected():
                        tutor_role[0].click()
                terms = self.find("#acceptTerms")
                if not terms.is_selected():
                    terms.click()
                self.click_button("Continue")
                self.wait_for_path(data["home"])
        return data

    def log_out_by_clearing_session(self):
        """Ends the session (the sign-out dialog itself is covered by its own test)."""
        self.driver.delete_all_cookies()

    def sign_out_with_button(self):
        self.click_button("Sign out")
        self.click_button("Continue")
        self.wait_for_path("/login")

    def navbar_text(self):
        """Everything in the top bar: the menu links plus the buttons on the right (Log in, Sign out, ...)."""
        return self.find("header").text

    def dismiss_dialog(self):
        """Closes the success/error dialog some forms show."""
        self.click_button("OK")

    # ---- shared flows ------------------------------------------------------

    def tutor_adds_window(self, day, start="09:00", end="10:00", length="60", mode="online", detail=None, expect_ok=True):
        """Signs in as the approved tutor and adds an availability window through the form."""
        self.login("tutor")
        self.find('form[aria-label="Add availability"]')
        self.set_value("#dayDate", day)
        self.set_value("#startTime", start)
        self.set_value("#endTime", end)
        self.select_value("#duration", length)
        if mode == "in_person":
            self.driver.find_element(By.CSS_SELECTOR, 'input[name="sessionMode"][value="in_person"]').click()
            self.type_into("#location", detail or "Public library, study room 2")
        else:
            self.type_into("#meetingUrl", detail or f"https://meet.example.com/{uuid.uuid4().hex[:10]}")
        self.click_button("Add availability")
        if expect_ok:
            self.wait_for_text("Availability added and appointment slots generated.")
            self.dismiss_dialog()

    def student_books(self, day, start_label, note=None, student="student"):
        """Signs in as a student, opens the demo tutor's profile and books the slot on `day` at `start_label`."""
        self.login(student)
        self.open("/student/tutors")
        self.click_link_containing(ACCOUNTS["tutor"]["name"])
        self.book_slot_on(day, start_label, note)

    def click_link_containing(self, text):
        xpath = f"//a[contains(normalize-space(.), '{text}')]"
        self.wait.until(EC.element_to_be_clickable((By.XPATH, xpath))).click()

    def slot_row(self, day, start_label):
        """The open-slot list item for a date and start time (for example '9:00 AM')."""
        label = datetime.strptime(day, "%Y-%m-%d").strftime("%a, %b ") + str(int(day[8:10])) + datetime.strptime(day, "%Y-%m-%d").strftime(", %Y")
        xpath = (
            "//li[@data-testid='open-slot']"
            f"[.//p[normalize-space(.)='{label}'] and contains(., '{start_label} to')]"
        )
        return self.wait.until(EC.visibility_of_element_located((By.XPATH, xpath)))

    def book_slot_on(self, day, start_label, note=None):
        row = self.slot_row(day, start_label)
        row.find_element(By.XPATH, ".//button[contains(normalize-space(.), 'Book session')]").click()
        if note:
            self.type_into(f"textarea[name='notes']", note)
        self.click_button("Confirm booking")

    def appointment_card(self, text):
        xpath = f"//li[@data-testid='appointment'][contains(., '{text}')]"
        return self.wait.until(EC.visibility_of_element_located((By.XPATH, xpath)))


def unique_email(prefix="selenium"):
    return f"{prefix}.{int(time.time())}.{uuid.uuid4().hex[:6]}@example.com"

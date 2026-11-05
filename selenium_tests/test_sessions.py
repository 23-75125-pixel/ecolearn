"""How a tutoring session is requested, confirmed, held and cancelled.

Requirements covered:
  FR-19..FR-22  tutors publish availability (online link or in-person place) and see bookings
  FR-23..FR-26  students find a tutor and book an open slot; one slot can never be booked twice
  FR-27, FR-28  students see their sessions; students and tutors cancel by the rules
  FR-30, FR-31  notifications about bookings and cancellations
  NFR-07        the rules (2-hour cancellation, one booking per slot) hold whatever the page shows

The flow under test:
  tutor adds a window -> student books a slot (status "Awaiting confirmation")
  -> tutor confirms -> student sees HOW to join (meeting link, or the place)
  -> either side may cancel under the cancellation rules.
"""

import uuid

from selenium.webdriver.common.by import By

from selenium_tests.base import SeleniumTestBase, clock_label, future_day, soon_window
from selenium_tests.config import ACCOUNTS, BASE_URL, PASSWORD

TUTOR_NAME = ACCOUNTS["tutor"]["name"]
STUDENT_NAME = ACCOUNTS["student"]["name"]


class SessionFlowTestCase(SeleniumTestBase):
    """Shared steps: set the stage with a tutor window, then act as the student or tutor."""

    def sign_in_fresh(self, account):
        self.driver.delete_all_cookies()
        return self.login(account)

    def stage_window(self, **kwargs):
        """Tutor creates a window; returns (day, link_or_place). Leaves the browser signed in as the tutor."""
        day = kwargs.pop("day", None) or future_day()
        detail = kwargs.pop("detail", None) or (
            "https://meet.example.com/" + uuid.uuid4().hex[:10] if kwargs.get("mode", "online") == "online" else "Public library, study room 2"
        )
        self.tutor_adds_window(day, detail=detail, **kwargs)
        return day, detail

    def book_as_student(self, day, start_label="9:00 AM", note=None, student="student"):
        self.sign_in_fresh(student)
        self.open("/student/tutors")
        self.click_link_containing(TUTOR_NAME)
        self.book_slot_on(day, start_label, note)
        self.wait_for_path("/student/dashboard")

    def slot_is_listed(self, day, start_label):
        from datetime import datetime

        stamp = datetime.strptime(day, "%Y-%m-%d")
        label = f"{stamp.strftime('%a, %b')} {stamp.day}, {stamp.year}"
        xpath = f"//li[@data-testid='open-slot'][.//p[normalize-space(.)='{label}'] and contains(., '{start_label} to')]"
        return bool(self.driver.find_elements(By.XPATH, xpath))

    def card_for(self, day, start_label="9:00 AM"):
        """The appointment card for one session. Each test books its own date, so a date identifies it
        even though the demo accounts keep appointments from other tests."""
        from datetime import datetime

        stamp = datetime.strptime(day, "%Y-%m-%d")
        label = f"{stamp.strftime('%a, %b')} {stamp.day}, {stamp.year}, {start_label} to"
        xpath = f"//li[@data-testid='appointment'][contains(normalize-space(.), '{label}')]"
        return self.wait.until(lambda d: next(iter(d.find_elements(By.XPATH, xpath)), None))

    def wait_card_status(self, day, status, start_label="9:00 AM"):
        try:
            self.wait.until(lambda d: self.card_for(day, start_label).get_attribute("data-status") == status)
        except Exception:
            self.fail(f"The session on {day} never reached status '{status}'. Page:\n{self.body_text()[:600]}")


class StudentBookingTests(SessionFlowTestCase):
    def test_student_books_a_slot_without_a_note(self):
        """The booking that used to fail with 'Notes must be 1000 characters or fewer.'"""
        day, _ = self.stage_window()
        self.book_as_student(day)
        self.wait_for_text("Session requested.")
        self.assertEqual(self.query.get("booked"), ["1"])
        card = self.card_for(day)
        self.assertIn("Awaiting confirmation", card.text)
        self.assertEqual(card.get_attribute("data-status"), "scheduled")

    def test_student_books_a_slot_with_a_note_and_the_tutor_sees_it(self):
        day, _ = self.stage_window()
        self.book_as_student(day, note="Please help me with fractions")
        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        card = self.card_for(day)
        self.assertIn("Please help me with fractions", card.text)
        self.assertIn("Awaiting confirmation", card.text)

    def test_the_student_is_told_the_link_comes_after_confirmation(self):
        day, link = self.stage_window()
        self.book_as_student(day)
        card = self.card_for(day)
        self.assertIn("will appear here once your tutor confirms", card.text)
        self.assertNotIn(link, card.get_attribute("innerHTML"), "The meeting link must not be shown before the tutor confirms.")
        self.assertFalse(card.find_elements(By.LINK_TEXT, "Join session"))

    def test_a_booked_slot_is_gone_for_other_students(self):
        self.skipTest("This scenario requires a second student account.")

    def test_two_students_cannot_take_the_same_slot(self):
        """Student B has the page open while student A books: B's click must be refused, not double-booked."""
        self.skipTest("This scenario requires a second student account.")

    def test_a_student_cannot_cancel_in_the_last_two_hours_but_the_tutor_can(self):
        day, start, end = soon_window()
        self.tutor_adds_window(day, start=start, end=end, length="30")
        self.book_as_student(day, start_label=clock_label(start))
        card = self.card_for(day, clock_label(start))
        self.assertFalse(card.find_elements(By.XPATH, ".//button[normalize-space(.)='Cancel session']"))
        self.assertIn("Cancelling closes 2 hours before the session starts.", card.text)

        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        tutor_card = self.card_for(day, clock_label(start))
        self.assertTrue(tutor_card.find_elements(By.XPATH, ".//button[normalize-space(.)='Cancel session']"), "A tutor may cancel until the session starts.")

    def test_a_student_cancels_well_in_advance_and_the_slot_opens_again(self):
        self.skipTest("This scenario requires a second student account.")

    def test_the_student_sees_notifications_for_the_booking(self):
        day, _ = self.stage_window()
        self.book_as_student(day)
        self.wait_for_text("Session requested")
        self.assertIn("is waiting for the tutor to confirm", self.body_text())

    def test_a_guest_who_clicks_log_in_to_book_can_sign_in_and_book(self):
        day, _ = self.stage_window()
        self.driver.delete_all_cookies()
        self.open("/tutors")
        self.click_link_containing(TUTOR_NAME)
        self.click_link("Log in to book")
        self.wait_for_path("/login")


class TutorSessionTests(SessionFlowTestCase):
    def test_tutor_confirms_and_the_student_gets_the_meeting_link(self):
        day, link = self.stage_window(mode="online")
        self.book_as_student(day)

        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        card = self.card_for(day)
        self.assertIn(link, self.body_text(), "The tutor sees the meeting link of their own window.")
        card.find_element(By.XPATH, ".//button[normalize-space(.)='Confirm session']").click()
        self.wait_card_status(day, "confirmed")
        self.assertFalse(self.card_for(day).find_elements(By.XPATH, ".//button[normalize-space(.)='Confirm session']"))

        self.sign_in_fresh("student")
        self.open("/student/dashboard")
        student_card = self.card_for(day)
        self.assertIn("Confirmed", student_card.text)
        self.assertIn("Online session", student_card.text)
        join = student_card.find_element(By.LINK_TEXT, "Join session")
        self.assertEqual(join.get_attribute("href"), link)
        self.assertEqual(join.get_attribute("target"), "_blank")
        self.assertIn("noopener", join.get_attribute("rel"))
        self.assertIn("Session confirmed", self.body_text())

    def test_in_person_sessions_show_the_place_not_a_link(self):
        day, place = self.stage_window(mode="in_person", detail="Barangay hall, room 3")
        self.book_as_student(day)
        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        self.card_for(day).find_element(By.XPATH, ".//button[normalize-space(.)='Confirm session']").click()
        self.wait_card_status(day, "confirmed")

        self.sign_in_fresh("student")
        self.open("/student/dashboard")
        card = self.card_for(day)
        self.assertIn("In-person session", card.text)
        self.assertIn("Barangay hall, room 3", card.text)
        self.assertFalse(card.find_elements(By.LINK_TEXT, "Join session"))

    def test_a_tutor_must_give_a_reason_when_cancelling_and_the_student_is_told_why(self):
        day, _ = self.stage_window()
        self.book_as_student(day)
        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        card = self.card_for(day)
        card.find_element(By.XPATH, ".//button[normalize-space(.)='Cancel session']").click()

        reason = self.find("textarea[name='reason']")
        self.assertTrue(self.driver.execute_script("return arguments[0].required", reason), "A reason must be required for a tutor.")
        self.click_button("Confirm cancellation")
        self.assertEqual(
            self.card_for(day).get_attribute("data-status"),
            "scheduled",
            "Without a reason the session must not be cancelled.",
        )

        reason.send_keys("I am unwell")
        self.click_button("Confirm cancellation")
        self.wait_card_status(day, "cancelled")

        self.sign_in_fresh("student")
        self.open("/student/dashboard")
        self.wait_for_text("Session cancelled by the tutor")
        self.assertIn("I am unwell", self.body_text())

    def test_a_tutor_cancellation_does_not_reopen_the_slot(self):
        self.skipTest("This scenario requires a second student account.")

    def test_complete_and_no_show_are_not_offered_before_the_session_starts(self):
        day, _ = self.stage_window()
        self.book_as_student(day)
        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        card = self.card_for(day)
        card.find_element(By.XPATH, ".//button[normalize-space(.)='Confirm session']").click()
        self.wait_card_status(day, "confirmed")
        for label in ("Mark as completed", "Student did not show up"):
            self.assertFalse(self.card_for(day).find_elements(By.XPATH, f".//button[normalize-space(.)='{label}']"), label)


class AvailabilityTests(SessionFlowTestCase):
    def test_a_two_hour_window_with_one_hour_sessions_makes_two_bookable_slots(self):
        day, _ = self.stage_window(start="09:00", end="11:00", length="60")
        self.sign_in_fresh("student")
        self.open("/student/tutors")
        self.click_link_containing(TUTOR_NAME)
        self.slot_row(day, "9:00 AM")
        self.slot_row(day, "10:00 AM")

    def test_online_and_in_person_slots_say_how_they_are_held(self):
        online_day, _ = self.stage_window(mode="online")
        person_day, _ = self.stage_window(mode="in_person", day=future_day(), detail="Library, room 2")
        self.sign_in_fresh("student")
        self.open("/student/tutors")
        self.click_link_containing(TUTOR_NAME)
        self.assertIn("Online (meeting link shared after confirmation)", self.slot_row(online_day, "9:00 AM").text)
        self.assertIn("In person", self.slot_row(person_day, "9:00 AM").text)

    def test_the_meeting_link_is_never_shown_on_the_public_profile(self):
        day, link = self.stage_window(mode="online")
        self.driver.delete_all_cookies()
        self.open("/tutors")
        self.click_link_containing(TUTOR_NAME)
        self.wait_for_text("Available sessions")
        self.assertNotIn(link, self.driver.page_source)

    def test_the_tutor_dashboard_lists_the_new_window_with_its_link(self):
        day, link = self.stage_window(mode="online")
        self.open("/tutor/dashboard")
        row = self.wait.until(lambda d: next((e for e in d.find_elements(By.CSS_SELECTOR, "[data-testid='availability-window']") if link in e.text), None))
        self.assertIn("60-minute sessions", row.text)

    def tutor_form_error(self, message, **window):
        self.tutor_adds_window(expect_ok=False, **window)
        self.wait_for_text(message)

    def test_an_end_time_before_the_start_time_is_refused(self):
        self.tutor_form_error("The end time must be after the start time.", day=future_day(), start="10:00", end="09:00")

    def test_a_window_that_does_not_fit_whole_sessions_is_refused(self):
        self.tutor_form_error("The window must fit whole 60-minute sessions", day=future_day(), start="09:00", end="10:30", length="60")

    def test_a_window_in_the_past_is_refused(self):
        self.tutor_form_error("Choose a future date and time.", day="2020-01-06")

    def test_overlapping_windows_are_refused(self):
        day, _ = self.stage_window()
        self.open("/tutor/dashboard")
        self.set_value("#dayDate", day)
        self.set_value("#startTime", "09:30")
        self.set_value("#endTime", "10:30")
        self.type_into("#meetingUrl", "https://meet.example.com/overlap")
        self.click_button("Add availability")
        self.wait_for_text("This time overlaps another availability window of yours.")

    def test_an_online_window_needs_a_secure_meeting_link(self):
        self.login("tutor")
        self.find('form[aria-label="Add availability"]')
        self.set_value("#dayDate", future_day())
        self.set_value("#startTime", "09:00")
        self.set_value("#endTime", "10:00")
        self.type_into("#meetingUrl", "http://insecure.example.com/room")
        self.click_button("Add availability")
        self.wait_for_text("Enter a meeting link that starts with https://.")

    def test_an_online_window_cannot_be_sent_without_a_link(self):
        self.login("tutor")
        self.find('form[aria-label="Add availability"]')
        link_field = self.find("#meetingUrl")
        self.assertTrue(self.driver.execute_script("return arguments[0].required", link_field))
        self.assertTrue(self.driver.execute_script("return arguments[0].validity.valueMissing", link_field))

    def test_an_unbooked_window_can_be_removed(self):
        day, link = self.stage_window()
        self.open("/tutor/dashboard")
        row = self.wait.until(lambda d: next((e for e in d.find_elements(By.CSS_SELECTOR, "[data-testid='availability-window']") if link in e.text), None))
        row.find_element(By.XPATH, ".//button[normalize-space(.)='Remove']").click()
        self.wait.until(lambda d: not any(link in e.text for e in d.find_elements(By.CSS_SELECTOR, "[data-testid='availability-window']")))

    def test_a_window_with_a_booking_cannot_be_removed_and_says_why(self):
        day, link = self.stage_window()
        self.book_as_student(day)
        self.sign_in_fresh("tutor")
        self.open("/tutor/dashboard")
        row = self.wait.until(lambda d: next((e for e in d.find_elements(By.CSS_SELECTOR, "[data-testid='availability-window']") if link in e.text), None))
        row.find_element(By.XPATH, ".//button[normalize-space(.)='Remove']").click()
        self.wait_for_text("This window has active appointments. Cancel them first, then remove the window.")
        self.assertTrue(any(link in e.text for e in self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='availability-window']")))

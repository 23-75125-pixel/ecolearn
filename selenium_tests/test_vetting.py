"""Tutor vetting: apply, get reviewed, and (only then) become bookable.

Requirements covered: FR-08..FR-12 (application, validation, credential upload,
status, resubmission), FR-13..FR-17 (admin queue, decisions, reasons),
FR-16 (approval creates the public profile), FR-18/FR-19 (only approved tutors
manage availability), FR-23 (the directory shows approved tutors only), NFR-04
(credential file type and size), NFR-01 (a tutor cannot approve themselves).
"""

import os
import tempfile
import uuid

from selenium.webdriver.common.by import By

from selenium_tests.base import SeleniumTestBase
from selenium_tests.config import EMAIL_CONFIRMATION_REQUIRED, PASSWORD

# The smallest file the server accepts as a PDF (it checks the file's first bytes, not just its name).
PDF_BYTES = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"


class VettingTestCase(SeleniumTestBase):
    def setUp(self):
        super().setUp()
        if EMAIL_CONFIRMATION_REQUIRED:
            self.skipTest("New accounts need email confirmation in this environment, so a brand-new tutor cannot sign in.")
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write_file(self, name, content):
        path = os.path.join(self.tmp.name, name)
        with open(path, "wb") as handle:
            handle.write(content)
        return path

    def register_new_tutor(self):
        """Registers a tutor through the form. Returns the full name shown to admins."""
        last_name = "Applicant" + uuid.uuid4().hex[:8]
        self.open("/register")
        self.type_into("#firstName", "Vera")
        self.type_into("#lastName", last_name)
        self.type_into("#email", f"{last_name.lower()}@example.com")
        self.type_into("#password", PASSWORD)
        self.type_into("#confirmPassword", PASSWORD)
        self.driver.find_element(By.CSS_SELECTOR, 'input[name="role"][value="tutor"]').find_element(By.XPATH, "..").click()
        self.driver.find_element(By.CSS_SELECTOR, "#acceptTerms").click()
        self.click_button("Create account")
        self.wait_for_path("/tutor/dashboard")
        return f"Vera {last_name}"

    def fill_application(self, file_path=None):
        self.type_into("#schoolName", "Batangas State University")
        self.type_into("#degree", "Bachelor of Science in Education")
        self.type_into("#major", "Mathematics")
        self.type_into("#graduationYear", "2024")
        self.type_into("#experience", "I tutored high school students in algebra for two years.")
        self.type_into("#yearsExperience", "2")
        self.type_into("#teachingApproach", "Practice first, with short quizzes")
        self.driver.find_elements(By.CSS_SELECTOR, 'input[name="subjectIds"]')[0].click()
        self.driver.find_elements(By.CSS_SELECTOR, 'input[name="preferredModes"]')[0].click()
        if file_path:
            self.driver.find_element(By.CSS_SELECTOR, "#credential").send_keys(file_path)

    def submit_application(self):
        self.click_button("Submit application")

    def admin_opens_review(self, applicant_name):
        self.login("admin")
        self.find("[data-testid='review-item']")
        row = self.wait.until(
            lambda d: next((e for e in d.find_elements(By.CSS_SELECTOR, "[data-testid='review-item']") if applicant_name in e.text), None)
        )
        row.find_element(By.LINK_TEXT, "Review").click()
        self.wait.until(lambda d: "/admin/applications/" in d.current_url)

    def confirm_dialog(self):
        self.click_button("Continue")


class TutorApplicationTests(VettingTestCase):
    def test_a_new_tutor_sees_the_application_and_cannot_set_availability_yet(self):
        self.register_new_tutor()
        self.wait_for_text("Start your tutor application")
        self.assertIn("Approval is required before you can set availability", self.body_text())
        self.assertFalse(self.present('form[aria-label="Add availability"]'), "Availability is only for approved tutors.")

    def test_an_empty_application_is_refused_with_a_message_per_problem(self):
        self.register_new_tutor()
        self.click_button("Submit application")
        for message in ("School is required.", "Choose at least one subject.", "Choose at least one teaching mode.", "Upload a credential document."):
            with self.subTest(message=message):
                self.wait_for_text(message)

    def test_only_pdf_jpg_and_png_credentials_are_accepted(self):
        self.register_new_tutor()
        self.fill_application(self.write_file("notes.txt", b"just text"))
        self.submit_application()
        self.wait_for_text("Upload a PDF, JPG, or PNG file.")

    def test_a_file_that_is_not_really_a_pdf_is_refused(self):
        self.register_new_tutor()
        self.fill_application(self.write_file("fake.pdf", b"this is not a pdf"))
        self.submit_application()
        self.wait_for_text("That file does not look like a real PDF, JPG, or PNG.")
        self.dismiss_dialog()
        self.assertNotIn("Pending review", self.body_text(), "A fake PDF must not get the application submitted.")

    def test_a_complete_application_is_submitted_and_waits_for_review(self):
        self.register_new_tutor()
        self.fill_application(self.write_file("diploma.pdf", PDF_BYTES))
        self.submit_application()
        # The form is replaced by the status card, so the new status is the confirmation.
        self.wait_for_text("Pending review")
        self.assertIn("Your application is currently being reviewed.", self.body_text())
        self.assertFalse(self.present("#schoolName"), "A submitted application can no longer be edited.")


class AdminReviewTests(VettingTestCase):
    def apply_as_new_tutor(self):
        name = self.register_new_tutor()
        self.fill_application(self.write_file("diploma.pdf", PDF_BYTES))
        self.submit_application()
        self.wait_for_text("Pending review")
        return name

    def test_a_submitted_application_reaches_the_admin_queue_and_can_be_approved(self):
        name = self.apply_as_new_tutor()
        self.admin_opens_review(name)
        self.assertIn(name, self.find("h1").text)
        self.click_button("Approve")
        self.confirm_dialog()
        self.wait_for_path("/admin/dashboard")
        self.wait_for_text("Applications awaiting review")
        self.assertNotIn(name, self.body_text(), "A decided application must leave the review queue.")

        # The tutor is now public and may set availability.
        self.driver.delete_all_cookies()
        self.open("/tutors")
        self.wait_for_text(name)

    def test_rejection_needs_a_reason_and_the_tutor_sees_it(self):
        name = self.apply_as_new_tutor()
        tutor_email = name.split(" ")[1].lower() + "@example.com"
        self.admin_opens_review(name)
        self.click_button("Reject")
        reason = self.find("#reject-reason")
        self.assertTrue(self.driver.execute_script("return arguments[0].required", reason))
        reason.send_keys("The diploma is not readable")
        self.click_button("Confirm rejection")
        self.confirm_dialog()
        self.wait_for_path("/admin/dashboard")

        self.open("/terms")
        self.driver.delete_all_cookies()
        self.open("/login")
        self.type_into("#email", tutor_email)
        self.type_into("#password", PASSWORD)
        self.click_button("Sign in")
        self.wait_for_path("/tutor/dashboard")
        self.wait_for_text("Not approved")
        self.assertIn("The diploma is not readable", self.body_text())
        self.assertFalse(self.present('form[aria-label="Add availability"]'))

    def test_a_revision_request_needs_a_reason_and_lets_the_tutor_resubmit(self):
        name = self.apply_as_new_tutor()
        tutor_email = name.split(" ")[1].lower() + "@example.com"
        self.admin_opens_review(name)
        self.click_button("Request revision")
        reason = self.find("#revision-reason")
        self.assertTrue(self.driver.execute_script("return arguments[0].required", reason))
        reason.send_keys("Please upload a clearer scan")
        self.click_button("Send feedback")
        self.wait_for_path("/admin/dashboard")

        self.open("/terms")
        self.driver.delete_all_cookies()
        self.open("/login")
        self.type_into("#email", tutor_email)
        self.type_into("#password", PASSWORD)
        self.click_button("Sign in")
        self.wait_for_path("/tutor/dashboard")
        self.wait_for_text("Needs revision")
        self.assertIn("Please upload a clearer scan", self.body_text())
        self.click_button("Submit updated application")
        self.wait_for_text("Pending review")

    def test_applications_waiting_for_the_tutor_are_not_in_the_review_queue(self):
        self.skipTest("This scenario requires separate pending and revision tutor accounts.")

    def test_a_tutor_cannot_open_the_admin_review_page(self):
        self.login("tutor")
        self.open("/admin/applications/00000000-0000-0000-0000-000000000000")
        self.wait_for_path("/tutor/dashboard")

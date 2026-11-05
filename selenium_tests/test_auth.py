"""Registration, sign-in and password recovery.

Requirements covered: FR-01 (register with name, email, password and a role),
FR-02 (password rules and accepting the Terms), FR-03 (sign in and land on the
dashboard of the user's role), FR-04 (Google sign-in is offered), FR-05
(password reset by email, the same answer whether or not the email exists),
NFR-06 (generic errors that do not reveal which accounts exist), NFR-10
(specific validation messages), NFR-15 (Terms must be accepted).
"""

from selenium.webdriver.common.by import By

from selenium_tests.base import SeleniumTestBase, unique_email
from selenium_tests.config import ACCOUNTS, EMAIL_CONFIRMATION_REQUIRED, PASSWORD


class LoginTests(SeleniumTestBase):
    def test_login_form_shows_fields_and_the_ways_to_continue(self):
        self.open("/login")
        self.assertTrue(self.find("#email").is_displayed())
        self.assertTrue(self.find("#password").is_displayed())
        for label in ("Sign in", "Continue with Google"):
            self.assertTrue(self.driver.find_elements(By.XPATH, f"//button[normalize-space(.)='{label}']"), f"Missing button: {label}")
        self.assertTrue(self.driver.find_elements(By.LINK_TEXT, "Forgot password?"))
        self.assertTrue(self.driver.find_elements(By.LINK_TEXT, "Register"))

    def test_empty_form_shows_a_message_for_each_field(self):
        self.open("/login")
        self.click_button("Sign in")
        self.wait_for_text("Enter a valid email address.")
        self.wait_for_text("Enter your password.")
        self.assertEqual(self.path, "/login")

    def test_wrong_password_gives_one_generic_error_and_stays_on_login(self):
        self.open("/login")
        self.type_into("#email", ACCOUNTS["student"]["email"])
        self.type_into("#password", "not-the-password")
        self.click_button("Sign in")
        self.wait_for_text("Invalid email or password.")
        self.assertEqual(self.path, "/login")

    def test_unknown_email_gets_the_same_error_as_a_wrong_password(self):
        self.open("/login")
        self.type_into("#email", unique_email("nobody"))
        self.type_into("#password", PASSWORD)
        self.click_button("Sign in")
        self.wait_for_text("Invalid email or password.")

    def test_each_role_signs_in_straight_to_its_own_dashboard(self):
        expected_heading = {
            "student": f"Welcome, {ACCOUNTS['student']['name'].split()[0]}",
            "tutor": f"Welcome, {ACCOUNTS['tutor']['name'].split()[0]}",
            "admin": "Admin dashboard",
        }
        for account, heading in expected_heading.items():
            with self.subTest(account=account):
                self.driver.delete_all_cookies()
                home = self.login(account)["home"]
                self.assertEqual(self.path, home)
                self.assertIn(heading, self.find("h1").text)
                self.assertFalse(self.driver.find_elements(By.XPATH, "//button[normalize-space(.)='OK']"), "Signing in must not need an extra confirmation click.")

    def test_login_returns_to_the_page_that_was_requested(self):
        self.open("/student/tutors")
        self.wait_for_path("/login")
        self.type_into("#email", ACCOUNTS["student"]["email"])
        self.type_into("#password", PASSWORD)
        self.click_button("Sign in")
        self.wait_for_path("/student/tutors")

    def test_login_ignores_a_requested_page_of_another_role(self):
        self.open("/login?next=/admin/dashboard")
        self.type_into("#email", ACCOUNTS["student"]["email"])
        self.type_into("#password", PASSWORD)
        self.click_button("Sign in")
        self.wait_for_path("/student/dashboard")

    def test_forgot_password_link_opens_the_reset_request_form(self):
        self.open("/login")
        self.click_link("Forgot password?")
        self.wait_for_path("/forgot-password")
        self.assertTrue(self.find("#email").is_displayed())
        self.assertTrue(self.driver.find_elements(By.XPATH, "//button[normalize-space(.)='Send reset link']"))

    def test_register_link_opens_the_registration_form(self):
        self.open("/login")
        self.driver.find_element(By.CSS_SELECTOR, 'a[href="/register"]').click()
        self.wait_for_path("/register")


class RegisterTests(SeleniumTestBase):
    def fill_valid_form(self, role="student", email=None):
        email = email or unique_email()
        self.open("/register")
        self.type_into("#firstName", "Test")
        self.type_into("#lastName", "Learner")
        self.type_into("#email", email)
        self.type_into("#password", PASSWORD)
        self.type_into("#confirmPassword", PASSWORD)
        if role == "tutor":
            self.driver.find_element(By.CSS_SELECTOR, 'input[name="role"][value="tutor"]').find_element(By.XPATH, "..").click()
        return email

    def accept_terms(self):
        self.driver.find_element(By.CSS_SELECTOR, "#acceptTerms").click()

    def test_register_form_shows_every_field(self):
        self.open("/register")
        for field in ("firstName", "lastName", "email", "password", "confirmPassword"):
            self.assertTrue(self.find(f"#{field}").is_displayed(), field)
        self.assertTrue(self.driver.find_elements(By.XPATH, "//button[normalize-space(.)='Create account']"))
        self.assertTrue(self.driver.find_elements(By.XPATH, "//button[normalize-space(.)='Sign up with Google']"))

    def test_student_is_the_default_role_and_tutor_can_be_chosen(self):
        self.open("/register")
        student = self.find('input[name="role"][value="student"]')
        tutor = self.driver.find_element(By.CSS_SELECTOR, 'input[name="role"][value="tutor"]')
        self.assertTrue(student.is_selected())
        self.assertFalse(tutor.is_selected())
        tutor.find_element(By.XPATH, "..").click()
        self.assertTrue(tutor.is_selected())
        self.assertFalse(student.is_selected())

    def test_no_admin_role_can_be_chosen(self):
        self.open("/register")
        values = [e.get_attribute("value") for e in self.driver.find_elements(By.CSS_SELECTOR, 'input[name="role"]')]
        self.assertCountEqual(values, ["student", "tutor"])

    def test_password_can_be_shown_and_hidden(self):
        self.open("/register")
        field = self.find("#password")
        self.assertEqual(field.get_attribute("type"), "password")
        self.click('button[aria-label="Show password"]')
        self.assertEqual(self.find("#password").get_attribute("type"), "text")
        self.click('button[aria-label="Hide password"]')
        self.assertEqual(self.find("#password").get_attribute("type"), "password")

    def test_terms_are_required_and_unticked_by_default(self):
        self.fill_valid_form()
        self.assertFalse(self.driver.find_element(By.CSS_SELECTOR, "#acceptTerms").is_selected())
        self.click_button("Create account")
        self.wait_for_text("You must accept the Terms of Service and Privacy Policy to continue.")
        self.assertEqual(self.path, "/register")

    def test_links_to_the_terms_and_privacy_policy_are_shown(self):
        self.open("/register")
        self.assertTrue(self.driver.find_elements(By.LINK_TEXT, "Terms of Service"))
        self.assertTrue(self.driver.find_elements(By.LINK_TEXT, "Privacy Policy"))

    def test_empty_form_reports_each_missing_field(self):
        self.open("/register")
        self.click_button("Create account")
        for message in ("First name is required.", "Last name is required.", "Enter a valid email address.", "Password must be at least 8 characters."):
            with self.subTest(message=message):
                self.wait_for_text(message)

    def test_passwords_must_match(self):
        self.fill_valid_form()
        self.type_into("#confirmPassword", "Different1!")
        self.accept_terms()
        self.click_button("Create account")
        self.wait_for_text("Passwords do not match.")
        self.assertEqual(self.path, "/register")

    def test_password_must_be_at_least_8_characters(self):
        self.fill_valid_form()
        self.type_into("#password", "short")
        self.type_into("#confirmPassword", "short")
        self.accept_terms()
        self.click_button("Create account")
        self.wait_for_text("Password must be at least 8 characters.")

    def test_registering_with_an_existing_email_is_refused(self):
        self.fill_valid_form(email=ACCOUNTS["student"]["email"])
        self.accept_terms()
        self.click_button("Create account")
        self.wait_for_text("An account with that email already exists.")
        self.assertEqual(self.path, "/register")

    def test_a_new_student_account_is_created_and_opens_the_student_dashboard(self):
        self.fill_valid_form(role="student")
        self.accept_terms()
        self.click_button("Create account")
        if EMAIL_CONFIRMATION_REQUIRED:
            self.wait_for_text("Check your email to confirm your account before signing in.")
        else:
            self.wait_for_path("/student/dashboard")
            self.assertIn("Welcome, Test", self.find("h1").text)

    def test_a_new_tutor_account_is_created_and_opens_the_tutor_dashboard(self):
        self.fill_valid_form(role="tutor")
        self.accept_terms()
        self.click_button("Create account")
        if EMAIL_CONFIRMATION_REQUIRED:
            self.wait_for_text("Check your email to confirm your account before signing in.")
        else:
            self.wait_for_path("/tutor/dashboard")
            self.assertIn("Welcome, Test", self.find("h1").text)


class ForgotPasswordTests(SeleniumTestBase):
    NOTICE = "If an account exists for that email, we've sent a link to reset your password."

    def test_a_known_and_an_unknown_email_get_the_same_answer(self):
        for email in (ACCOUNTS["student"]["email"], unique_email("nobody")):
            with self.subTest(email=email):
                self.open("/forgot-password")
                self.type_into("#email", email)
                self.click_button("Send reset link")
                self.wait_for_text(self.NOTICE)

    def test_the_send_button_is_only_enabled_for_a_valid_email(self):
        self.open("/forgot-password")
        button = self.find('button[type="submit"]')
        self.assertFalse(button.is_enabled(), "The button must be disabled while the email field is empty.")
        self.type_into("#email", "not-an-email")
        self.assertFalse(self.find('button[type="submit"]').is_enabled())
        self.type_into("#email", "someone@example.com")
        self.wait.until(lambda d: d.find_element(By.CSS_SELECTOR, 'button[type="submit"]').is_enabled())

    def test_reset_password_page_without_a_valid_link_is_not_usable(self):
        self.open("/reset-password")
        self.wait_for_path("/login")
        self.assertEqual(self.query.get("notice"), ["invalid_link"])

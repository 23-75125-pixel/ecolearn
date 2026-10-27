"""E2E tests for the login, register, forgot-password and legal pages."""

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.base import SeleniumTestBase


class TestLoginPage(SeleniumTestBase):
    def test_login_form_elements(self):
        self.open("/login")
        self.wait.until(EC.url_contains("/login"))
        self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        self.assertTrue(self.driver.find_element(By.ID, "email").is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, "password").is_displayed())
        submit = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        self.assertIn("Sign in", submit.text)

    def test_empty_login_shows_validation_error(self):
        self.open("/login")
        self.wait.until(EC.url_contains("/login"))
        self.wait.until(EC.element_to_be_clickable((By.ID, "email")))
        # The form is noValidate, so submitting empty fields exercises the
        # server-action validation path.
        self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        alert = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[role="alert"]'))
        )
        self.assertTrue(len(alert.text) > 0)

    def test_forgot_password_link_opens_form(self):
        self.open("/login")
        self.wait.until(EC.url_contains("/login"))
        link = self.wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Forgot password?")))
        link.send_keys(Keys.ENTER)
        self.wait.until(EC.url_contains("/forgot-password"))
        self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        submit = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        self.assertIn("Send reset link", submit.text)

    def test_google_button_is_shown(self):
        self.open("/login")
        self.wait.until(EC.url_contains("/login"))
        buttons = self.wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'button[type="submit"]'))
        )
        self.assertTrue(any("Continue with Google" in button.text for button in buttons))

    def test_register_link_from_login(self):
        self.open("/login")
        self.wait.until(EC.url_contains("/login"))
        link = self.wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Register")))
        link.send_keys(Keys.ENTER)
        self.wait.until(EC.url_contains("/register"))
        self.assertIn("/register", self.driver.current_url)


class TestRegisterPage(SeleniumTestBase):
    def test_register_form_elements(self):
        self.open("/register")
        self.wait.until(EC.url_contains("/register"))
        self.wait.until(EC.visibility_of_element_located((By.ID, "firstName")))
        for field_id in ("firstName", "lastName", "email", "password", "confirmPassword"):
            self.assertTrue(
                self.driver.find_element(By.ID, field_id).is_displayed(),
                f"Field {field_id} should be visible",
            )

    def test_role_toggle_selects_tutor(self):
        self.open("/register")
        self.wait.until(EC.url_contains("/register"))
        student_radio = self.driver.find_element(
            By.CSS_SELECTOR, 'input[name="role"][value="student"]'
        )
        tutor_radio = self.driver.find_element(
            By.CSS_SELECTOR, 'input[name="role"][value="tutor"]'
        )
        self.assertTrue(student_radio.is_selected())
        self.assertFalse(tutor_radio.is_selected())

        tutor_label = tutor_radio.find_element(By.XPATH, "..")
        tutor_label.click()

        self.wait.until(lambda _: tutor_radio.is_selected())
        self.assertTrue(tutor_radio.is_selected())
        self.assertFalse(student_radio.is_selected())

    def test_password_visibility_toggle(self):
        self.open("/register")
        self.wait.until(EC.url_contains("/register"))
        password = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
        self.assertEqual(password.get_attribute("type"), "password")
        toggle = self.driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Show password"]')
        toggle.click()
        self.assertEqual(
            self.driver.find_element(By.ID, "password").get_attribute("type"), "text"
        )

    def test_terms_checkbox_is_required(self):
        self.open("/register")
        self.wait.until(EC.url_contains("/register"))
        checkbox = self.wait.until(EC.presence_of_element_located((By.ID, "acceptTerms")))
        self.assertFalse(checkbox.is_selected())

        # Submitting an empty form shows the terms error along with the other errors.
        self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        self.wait.until(
            lambda driver: any(
                "Terms of Service" in alert.text
                for alert in driver.find_elements(By.CSS_SELECTOR, '[role="alert"]')
            )
        )

    def test_terms_and_privacy_links(self):
        self.open("/register")
        self.wait.until(EC.url_contains("/register"))
        self.assertTrue(self.driver.find_element(By.LINK_TEXT, "Terms of Service").is_displayed())
        self.assertTrue(self.driver.find_element(By.LINK_TEXT, "Privacy Policy").is_displayed())

    def test_google_sign_up_button_is_shown(self):
        self.open("/register")
        self.wait.until(EC.url_contains("/register"))
        buttons = self.wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'button[type="submit"]'))
        )
        self.assertTrue(any("Sign up with Google" in button.text for button in buttons))


class TestLegalPages(SeleniumTestBase):
    def test_terms_page_loads(self):
        self.open("/terms")
        heading = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        self.assertIn("Terms of Service", heading.text)

    def test_privacy_page_loads(self):
        self.open("/privacy")
        heading = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        self.assertIn("Privacy Policy", heading.text)

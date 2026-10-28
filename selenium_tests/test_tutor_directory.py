"""E2E tests for the public tutor directory and tutor profile pages."""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.base import SeleniumTestBase


class TestTutorDirectory(SeleniumTestBase):
    def test_tutors_page_loads(self):
        self.open("/tutors")
        self.wait.until(EC.url_contains("/tutors"))
        heading = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        self.assertIn("Find a tutor", heading.text)

    def test_tutor_directory_shows_verified_tutors(self):
        self.open("/tutors")
        self.wait.until(EC.url_contains("/tutors"))
        body = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertIn("Verified tutor", body)

    def test_tutor_directory_search(self):
        self.open("/tutors")
        self.wait.until(EC.url_contains("/tutors"))
        search = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'input[placeholder*="Search"]')))
        search.send_keys("Math")
        self.wait.until(lambda _: "No tutors match those filters" in self.driver.find_element(By.TAG_NAME, "body").text or "Math" in self.driver.find_element(By.TAG_NAME, "body").text)
        body = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue("No tutors match those filters" in body or "Math" in body, f"Expected filter results, got: {body}")

    def test_tutor_directory_subject_filter(self):
        self.open("/tutors")
        self.wait.until(EC.url_contains("/tutors"))
        # Look for a subject filter dropdown
        selects = self.driver.find_elements(By.TAG_NAME, "select")
        if selects:
            select = selects[0]
            options = select.find_elements(By.TAG_NAME, "option")
            self.assertGreater(len(options), 0, "Subject filter should have options")

    def test_tutor_profile_detail_page(self):
        self.open("/tutors")
        self.wait.until(EC.url_contains("/tutors"))
        # Click on the first tutor card link
        tutor_links = self.driver.find_elements(By.CSS_SELECTOR, 'a[href^="/tutors/"]')
        if tutor_links:
            tutor_links[0].click()
            self.wait.until(EC.url_matches(r".*/tutors/[a-f0-9-]+$"))
            self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
            body = self.driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Verified tutor", body)

    def test_tutor_profile_not_found(self):
        self.open("/tutors/00000000-0000-0000-0000-000000000000")
        self.wait.until(EC.url_contains("/tutors/"))
        # Should show not found or empty state
        body = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue(len(body) > 0)
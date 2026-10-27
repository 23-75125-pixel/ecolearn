"""E2E tests for the navbar and About page."""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.base import SeleniumTestBase


class TestPublicNavigation(SeleniumTestBase):
    def test_navbar_links_present(self):
        self.open("/")
        nav = self.primary_nav()
        self.assertIn("Home", nav.text)
        self.assertIn("Find Tutors", nav.text)
        self.assertIn("About", nav.text)

    def test_navbar_about_link_navigates(self):
        self.open("/")
        nav = self.primary_nav()
        nav.find_element(By.LINK_TEXT, "About").click()
        self.wait.until(EC.url_contains("/about"))
        self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        self.assertIn("/about", self.driver.current_url)


class TestAboutPage(SeleniumTestBase):
    def test_about_page_heading(self):
        self.open("/about")
        heading = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        self.assertEqual(heading.text, "About ECoLearn")

    def test_about_page_copy(self):
        self.open("/about")
        body = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "body"))).text
        self.assertIn("tutor vetting", body)
        self.assertIn("Eco Learn. All rights reserved.", body)

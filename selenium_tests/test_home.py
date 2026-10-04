"""E2E tests for the public home page."""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.base import SeleniumTestBase


class TestHomePage(SeleniumTestBase):
    def test_home_page_loads_with_title(self):
        self.open("/")
        self.wait.until(EC.title_contains("Eco Learn"))
        self.assertIn("Eco Learn", self.driver.title)

    def test_home_page_shows_hero_and_steps(self):
        self.open("/")
        self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h2")))
        body = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertIn("Simple steps. Better support.", body)
        self.assertIn("Choose your guide", body)
        self.assertIn("Keep moving forward", body)

    def test_explore_tutors_link_navigates_to_tutors(self):
        self.open("/")
        link = self.wait.until(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "Find your tutor")))
        link.click()
        self.wait.until(EC.url_contains("/tutors"))
        self.assertIn("/tutors", self.driver.current_url)

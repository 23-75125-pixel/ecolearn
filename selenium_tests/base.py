"""Base test case with shared browser setup/teardown."""

import unittest

from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from selenium_tests.config import BASE_URL, WAIT_TIMEOUT_SECONDS, build_driver


class SeleniumTestBase(unittest.TestCase):
    """Shared browser lifecycle: one fresh Chromium window per test."""

    def setUp(self):
        self.driver = build_driver()
        self.wait = WebDriverWait(self.driver, WAIT_TIMEOUT_SECONDS)

    def tearDown(self):
        self.driver.quit()

    def open(self, path):
        """Navigates to `path` relative to BASE_URL."""
        self.driver.get(f"{BASE_URL}{path}")

    def primary_nav(self):
        """Waits for and returns the primary navbar element."""
        from selenium.webdriver.common.by import By

        return self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'nav[aria-label="Primary"]'))
        )

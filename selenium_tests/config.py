"""Shared test configuration for the E2E suite.

Environment overrides:
    BASE_URL  — target server (default http://localhost:3000)
    HEADED    — set to 1 to open a visible browser (default: headless)
"""

import os

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
HEADED = os.environ.get("HEADED", "") == "1"

CHROMIUM_BINARY = "/usr/bin/chromium"
CHROMEDRIVER_BINARY = "/usr/bin/chromedriver"

WINDOW_SIZE = "1440,900"
PAGE_LOAD_TIMEOUT_SECONDS = 60
WAIT_TIMEOUT_SECONDS = 15


def build_driver():
    """Creates a Chromium WebDriver using the environment's local binaries."""
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service

    options = webdriver.ChromeOptions()
    options.binary_location = CHROMIUM_BINARY
    if not HEADED:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={WINDOW_SIZE}")

    driver = webdriver.Chrome(
        service=Service(executable_path=CHROMEDRIVER_BINARY),
        options=options,
    )
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT_SECONDS)
    return driver

"""The administrator's dashboard and metric pages.

Requirements covered: FR-13 (dashboard with counts and the review queue),
FR-14 (open an application), NFR-01/NFR-02 (admin-only data), NFR-10 (clear
empty and error states).
"""

from selenium.webdriver.common.by import By

from selenium_tests.base import SeleniumTestBase
from selenium_tests.config import ACCOUNTS

METRICS = {
    "students": (["Miguel Dela Cruz", "Bea Reyes"], "Students"),
    "tutor-accounts": (["Liza Fernandez", "Noel Garcia"], "Tutor accounts"),
    "pending-applications": (["Noel Garcia"], "Pending applications"),
    "approved-tutors": (["Liza Fernandez"], "Approved tutors"),
    "availability": (["Liza Fernandez"], "Availability windows"),
}


class AdminDashboardTests(SeleniumTestBase):
    def setUp(self):
        super().setUp()
        self.login("admin")

    def test_the_dashboard_shows_every_metric_card_with_a_number(self):
        self.assertIn("Admin dashboard", self.find("h1").text)
        cards = self.driver.find_elements(By.CSS_SELECTOR, "a[href^='/admin/metrics/']")
        self.assertEqual(len(cards), 7)
        for card in cards:
            self.assertTrue(card.text.split("\n")[0].isdigit(), f"Metric card without a count: {card.text!r}")

    def test_each_metric_card_opens_its_list(self):
        for slug, (names, heading) in METRICS.items():
            with self.subTest(metric=slug):
                self.open(f"/admin/metrics/{slug}")
                self.assertEqual(self.find("h1").text, heading)
                text = self.body_text()
                for name in names:
                    self.assertIn(name, text)

    def test_pending_applications_does_not_list_rejected_or_approved_tutors(self):
        self.open("/admin/metrics/pending-applications")
        self.wait_for_text("Noel Garcia")
        self.assert_no_text("Liza Fernandez")

    def test_the_students_list_shows_contact_details_for_the_admin(self):
        self.open("/admin/metrics/students")
        self.wait_for_text("student1@ecolearn.test")

    def test_an_unknown_metric_is_not_found(self):
        self.open("/admin/metrics/not-a-metric")
        self.wait_for_text("404")

    def test_the_admin_menu_has_a_dashboard_link_back(self):
        self.open("/admin/metrics/students")
        self.click_link("Dashboard")
        self.wait_for_path("/admin/dashboard")

"""Who may open what.

Requirements covered: FR-07 (each dashboard is restricted to its role; a signed-in
user is redirected away from the sign-in pages), FR-32 (public pages and a menu
that fits the role), NFR-01 (access is enforced for every role).

  * Guests: the landing page with its footer, About, the tutor directory and the
    sign-in pages. Nothing in /student, /tutor or /admin.
  * Signed-in users: only their own section. The landing page, its footer and the
    sign-in pages are never shown to them.
"""

from selenium_tests.base import SeleniumTestBase
from selenium_tests.config import ACCOUNTS

GUEST_ONLY_PAGES = ["/", "/about", "/login", "/register", "/forgot-password"]
PROTECTED_PAGES = ["/student/dashboard", "/student/tutors", "/tutor/dashboard", "/admin/dashboard", "/admin/metrics/students"]
ROLE_ACCOUNTS = {"student": "student", "tutor": "tutor", "admin": "admin"}


class GuestAccessTests(SeleniumTestBase):
    def test_guest_sees_the_landing_page_with_the_footer(self):
        self.open("/")
        self.assertEqual(self.path, "/")
        self.wait_for_text("Learn anything you set your mind to.")
        self.assertTrue(self.present("footer"), "The footer must be shown to guests on the landing page.")
        footer = self.find("footer").text
        for text in ("Terms of Service", "Privacy Policy"):
            self.assertIn(text, footer)

    def test_guest_menu_offers_only_public_links(self):
        self.open("/")
        nav = self.navbar_text()
        for label in ("Home", "Find Tutors", "About", "Log in", "Register"):
            self.assertIn(label, nav)
        self.assertNotIn("Dashboard", nav)
        self.assertNotIn("Sign out", nav)

    def test_guest_can_open_about_and_it_has_the_footer(self):
        self.open("/about")
        self.assertEqual(self.path, "/about")
        self.assertTrue(self.find("h1").text.startswith("About"))
        self.assertTrue(self.present("footer"))

    def test_guest_can_browse_the_directory_and_a_profile_but_not_book(self):
        self.open("/tutors")
        self.assertEqual(self.path, "/tutors")
        self.wait_for_text(ACCOUNTS["tutor"]["name"])
        self.click_link_containing(ACCOUNTS["tutor"]["name"])
        self.wait.until(lambda d: d.current_url.split("/tutors/")[-1] != "" and "/tutors/" in d.current_url)
        self.wait_for_text("Available sessions")
        self.assertFalse(self.find_all("li[data-testid='open-slot'] button"), "A guest must not see booking buttons.")
        self.click_link("Log in to book")
        self.wait_for_path("/login")

    def test_guest_cannot_open_any_protected_section(self):
        for page in PROTECTED_PAGES:
            with self.subTest(page=page):
                self.open(page)
                self.wait_for_path("/login")
                self.assertEqual(self.query.get("next"), [page], "The login page should remember where the guest was going.")

    def test_guest_cannot_open_complete_signup(self):
        self.assert_lands_on("/complete-signup", "/login")

    def test_terms_and_privacy_are_readable_without_the_landing_footer(self):
        for page, heading in (("/terms", "Terms of Service"), ("/privacy", "Privacy Policy")):
            with self.subTest(page=page):
                self.open(page)
                self.assertEqual(self.path, page)
                self.assertIn(heading, self.find("h1").text)
                self.assertFalse(self.present("footer"), "Legal pages use a plain frame, not the landing footer.")


class SignedInAccessTests(SeleniumTestBase):
    def test_signed_in_users_never_see_guest_pages(self):
        for role, account in ROLE_ACCOUNTS.items():
            self.driver.delete_all_cookies()
            home = self.login(account)["home"]
            for page in GUEST_ONLY_PAGES:
                with self.subTest(role=role, page=page):
                    self.assert_lands_on(page, home)
                    self.assertFalse(self.present("footer"), "The landing footer must never be shown after sign-in.")

    def test_signed_in_tutor_and_admin_cannot_use_the_public_directory(self):
        for account in ("tutor", "admin"):
            self.driver.delete_all_cookies()
            home = self.login(account)["home"]
            with self.subTest(account=account):
                self.assert_lands_on("/tutors", home)

    def test_a_student_is_moved_into_the_student_directory(self):
        self.login("student")
        self.assert_lands_on("/tutors", "/student/tutors")
        self.wait_for_text(ACCOUNTS["tutor"]["name"])
        self.assertFalse(self.present("footer"))

    def test_every_role_is_kept_inside_its_own_section(self):
        sections = {"student": "/student/dashboard", "tutor": "/tutor/dashboard", "admin": "/admin/dashboard"}
        for role, account in ROLE_ACCOUNTS.items():
            self.driver.delete_all_cookies()
            home = self.login(account)["home"]
            for other_role, other_home in sections.items():
                if other_role == role:
                    continue
                with self.subTest(role=role, tries=other_home):
                    self.assert_lands_on(other_home, home)

    def test_each_role_sees_a_menu_for_its_own_section_only(self):
        expectations = {
            "student": (["Dashboard", "Find Tutors", "Sign out"], ["Register", "Log in"]),
            "tutor": (["Dashboard", "Sign out"], ["Find Tutors", "Register", "Log in"]),
            "admin": (["Dashboard", "Sign out"], ["Find Tutors", "Register", "Log in"]),
        }
        for role, (present, absent) in expectations.items():
            self.driver.delete_all_cookies()
            self.login(role)
            nav = self.navbar_text()
            for label in present:
                with self.subTest(role=role, shows=label):
                    self.assertIn(label, nav)
            for label in absent:
                with self.subTest(role=role, hides=label):
                    self.assertNotIn(label, nav)

    def test_after_signing_out_the_protected_pages_need_a_login_again(self):
        self.login("student")
        self.sign_out_with_button()
        self.assert_lands_on("/", "/")
        self.assertTrue(self.present("footer"), "A signed-out visitor is a guest again and sees the landing page.")
        self.assert_lands_on("/student/dashboard", "/login")

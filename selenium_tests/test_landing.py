"""The guest landing page and the public tutor directory.

Requirements covered: FR-23 (public directory with a subject filter), FR-32
(Home, About, Terms and Privacy pages and a menu that fits the visitor), NFR-10
(simple, consistent interface), NFR-12 (interactive parts work from the keyboard).
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select

from selenium_tests.base import SeleniumTestBase
from selenium_tests.config import ACCOUNTS

TUTOR_NAME = ACCOUNTS["tutor"]["name"]
SUBJECT_TABS = ["Mathematics", "Science", "English", "Computer Programming"]


class LandingPageTests(SeleniumTestBase):
    def setUp(self):
        super().setUp()
        self.open("/")

    def test_page_title_and_main_sections(self):
        self.assertIn("Eco Learn", self.driver.title)
        # The headline fades in word by word, so wait for the whole sentence.
        self.wait.until(lambda d: "Learn anything you set your mind to." in self.page_text())
        for text in (
            "Learn anything you set your mind to.",
            "Find help in the subject you need.",
            "What a good session looks like.",
            "Simple steps. Better support.",
            "Frequently asked questions",
            "Ready to learn with more confidence?",
        ):
            with self.subTest(section=text):
                self.assertIn(text, self.page_text())

    def test_the_three_steps_are_shown(self):
        text = self.body_text()
        for step in ("Choose your guide", "Find your rhythm", "Keep moving forward"):
            self.assertIn(step, text)

    def test_find_your_tutor_opens_the_directory(self):
        self.click_link("Find your tutor")
        self.wait_for_path("/tutors")

    def test_every_image_on_the_page_loads(self):
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
        self.wait.until(
            lambda d: d.execute_script(
                "return [...document.images].every(img => img.complete && img.naturalWidth > 0)"
            )
        )
        broken = self.driver.execute_script("return [...document.images].filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.src)")
        self.assertEqual(broken, [], "Some images did not load.")

    def test_the_footer_links_go_to_the_right_pages(self):
        footer = self.find("footer")
        for label, path in (("Terms of Service", "/terms"), ("Privacy Policy", "/privacy")):
            with self.subTest(link=label):
                self.open("/")
                self.find("footer").find_element(By.LINK_TEXT, label).click()
                self.wait_for_path(path)
        self.assertIsNotNone(footer)

    def test_faq_answers_open_and_describe_the_session_rules(self):
        summary = self.driver.find_element(By.XPATH, "//summary[contains(., 'Can I cancel')]")
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", summary)
        details = summary.find_element(By.XPATH, "..")
        self.assertIsNone(details.get_attribute("open"))
        summary.click()
        self.assertIsNotNone(details.get_attribute("open"))
        self.assertIn("up to 2 hours before it starts", details.text)

    def test_the_persona_tabs_switch_content(self):
        tabs = {tab.text: tab for tab in self.driver.find_elements(By.CSS_SELECTOR, "[role='tab']") if tab.text in ("Students", "Parents", "Tutors")}
        self.assertEqual(set(tabs), {"Students", "Parents", "Tutors"})
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", tabs["Tutors"])
        self.assertEqual(tabs["Students"].get_attribute("aria-selected"), "true")
        tabs["Tutors"].click()
        self.assertEqual(tabs["Tutors"].get_attribute("aria-selected"), "true")
        self.assertEqual(tabs["Students"].get_attribute("aria-selected"), "false")


class HeroBookingPreviewTests(SeleniumTestBase):
    """The small booking preview in the hero. It is a demo: it never touches the database."""

    def setUp(self):
        super().setUp()
        self.open("/")
        self.find("[role='radiogroup']")

    def radio(self, label):
        return self.driver.find_element(By.XPATH, f"//button[@role='radio'][contains(@aria-label, '{label}')]")

    def test_a_booked_time_cannot_be_chosen(self):
        taken = self.radio("4:00 PM")
        self.assertFalse(taken.is_enabled())
        self.assertIn("already booked", taken.get_attribute("aria-label"))

    def test_the_book_button_waits_for_a_choice_then_confirms(self):
        button = self.driver.find_element(By.XPATH, "//button[normalize-space(.)='Pick a time']")
        self.assertFalse(button.is_enabled())
        self.radio("5:00 PM").click()
        self.assertEqual(self.radio("5:00 PM").get_attribute("aria-checked"), "true")
        self.click_button("Book 5:00 PM")
        self.wait_for_text("Session booked")
        self.assertIn("5:00 PM is yours", self.body_text())
        self.click_button("Try another time")
        self.find("[role='radiogroup']")
        self.assertEqual(self.radio("5:00 PM").get_attribute("aria-checked"), "false")

    def test_the_preview_is_labelled_as_a_preview(self):
        self.assertIn("Preview", self.find("[role='radiogroup']").find_element(By.XPATH, "../..").text)


class SubjectExplorerTests(SeleniumTestBase):
    def setUp(self):
        super().setUp()
        self.open("/")
        self.find("#subjects")

    def tab(self, name):
        return self.driver.find_element(By.XPATH, f"//*[@role='tab'][contains(., '{name}')]")

    def panel(self):
        return self.driver.find_element(By.CSS_SELECTOR, "#subjects [role='tabpanel']")

    def test_the_four_subjects_of_the_catalog_are_offered_and_the_first_is_selected(self):
        tabs = [t.find_element(By.XPATH, ".//span[contains(@class,'block')]").text for t in self.driver.find_elements(By.CSS_SELECTOR, "#subjects [role='tab']")]
        self.assertEqual(tabs, SUBJECT_TABS)
        self.assertEqual(self.tab("Mathematics").get_attribute("aria-selected"), "true")

    def test_choosing_a_subject_changes_the_panel_and_its_button(self):
        illustrations = set()
        for name in SUBJECT_TABS:
            with self.subTest(subject=name):
                self.tab(name).click()
                self.wait.until(lambda d: self.panel().find_element(By.TAG_NAME, "h3").text == name)
                self.assertTrue(self.panel().find_elements(By.LINK_TEXT, f"Find a {name} tutor"))
                illustrations.add(self.panel().find_element(By.CSS_SELECTOR, "svg[role='img']").get_attribute("aria-label"))
        self.assertEqual(len(illustrations), 4, "Each subject needs its own illustration.")

    def test_the_arrow_keys_move_between_subjects(self):
        self.tab("Mathematics").click()
        self.tab("Mathematics").send_keys(Keys.ARROW_DOWN)
        self.assertEqual(self.tab("Science").get_attribute("aria-selected"), "true")
        self.driver.switch_to.active_element.send_keys(Keys.END)
        self.assertEqual(self.tab("Computer Programming").get_attribute("aria-selected"), "true")
        self.driver.switch_to.active_element.send_keys(Keys.HOME)
        self.assertEqual(self.tab("Mathematics").get_attribute("aria-selected"), "true")

    def test_the_subject_button_opens_the_directory_filtered_by_that_subject(self):
        self.tab("Mathematics").click()
        self.panel().find_element(By.LINK_TEXT, "Find a Mathematics tutor").click()
        self.wait_for_path("/tutors")
        self.assertEqual(self.query.get("subject"), ["Mathematics"])
        self.wait_for_text(TUTOR_NAME)
        self.assertEqual(Select(self.find("select")).first_selected_option.text, "Mathematics")

    def test_a_subject_nobody_teaches_yet_falls_back_to_all_subjects(self):
        self.tab("Computer Programming").click()
        self.panel().find_element(By.LINK_TEXT, "Find a Computer Programming tutor").click()
        self.wait_for_path("/tutors")
        self.wait_for_text(TUTOR_NAME)
        self.assertEqual(Select(self.find("select")).first_selected_option.text, "All subjects")


class TutorDirectoryTests(SeleniumTestBase):
    def setUp(self):
        super().setUp()
        self.open("/tutors")
        self.wait_for_text(TUTOR_NAME)

    def test_only_approved_tutors_are_listed(self):
        text = self.body_text()
        self.assertIn(TUTOR_NAME, text)

    def test_a_tutor_card_shows_name_headline_and_subjects(self):
        card = self.driver.find_element(By.XPATH, f"//a[contains(., '{TUTOR_NAME}')]")
        for text in ("Verified tutor", "Mathematics", "Science"):
            self.assertIn(text, card.text)

    def test_search_by_name_filters_the_list(self):
        self.type_into("input[type='search'], input[placeholder*='Search']", "Fernandez")
        self.wait_for_text(TUTOR_NAME)
        self.type_into("input[type='search'], input[placeholder*='Search']", "zzzz-nobody")
        self.wait_for_text("No tutors match those filters.")

    def test_the_subject_filter_lists_only_subjects_that_tutors_teach(self):
        options = [o.text for o in Select(self.find("select")).options]
        self.assertEqual(options[0], "All subjects")
        self.assertCountEqual(options[1:], ["Mathematics", "Science"])
        Select(self.find("select")).select_by_visible_text("Science")
        self.wait_for_text(TUTOR_NAME)

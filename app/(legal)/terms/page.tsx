import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants/site";

export const metadata: Metadata = { title: `Terms of Service | ${SITE_NAME}` };

const SECTIONS: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      `${SITE_NAME} is a web platform where students find tutors who have been reviewed by an administrator, and book tutoring appointments with them. These Terms explain the rules for using it.`,
    ],
  },
  {
    heading: "Your account",
    bullets: [
      "You must give accurate information when you register and keep it up to date.",
      "You are responsible for keeping your password safe and for what happens under your account.",
      "If you are under 18, use the platform only with the knowledge and permission of a parent or guardian.",
      "You may sign in with email and password or with Google. Either way, you accept these Terms when you create your account.",
    ],
  },
  {
    heading: "Students, tutors and administrators",
    bullets: [
      "Students can browse verified tutors, book open appointment slots, and cancel their own bookings.",
      "Tutors must apply and be approved by an administrator before they appear in the tutor list or receive bookings.",
      "Administrators review tutor applications and may approve them, reject them, or ask for corrections.",
    ],
  },
  {
    heading: "Tutor verification",
    paragraphs: [
      "Tutors upload documents (for example an ID, a diploma or a certificate) so an administrator can check their background. Documents must be genuine and belong to you.",
      "Approval means an administrator reviewed the documents we received. It is not a guarantee of the quality of a tutor's teaching, and tutors are not employees or agents of the platform.",
    ],
  },
  {
    heading: "Bookings and cancellations",
    bullets: [
      "A slot is booked as soon as the booking is confirmed on screen. Slot times are shown in Philippine Time.",
      "Students can cancel up to 2 hours before the start time. Later changes must be arranged directly with the tutor.",
      "Tutors and administrators may cancel an appointment when necessary. The other person is notified.",
      `${SITE_NAME} does not process payments. Any fee is agreed between the student and the tutor.`,
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "provide false information or impersonate another person;",
      "upload files that are unlawful, harmful, or that you have no right to share;",
      "harass, threaten or discriminate against other users;",
      "try to access other people's data, break the platform's security, or disrupt the service;",
      "copy the platform's content in bulk, for example with automated tools.",
    ],
  },
  {
    heading: "Your content",
    paragraphs: [
      "You keep ownership of what you submit. By submitting it, you allow us to store and display it as needed to run the platform. For tutors, this includes showing your name, headline, bio, subjects and availability publicly in the tutor list. Your credential documents are never shown publicly.",
    ],
  },
  {
    heading: "Suspension and ending your account",
    paragraphs: [
      "We may deactivate a tutor profile or suspend an account that breaks these Terms or puts others at risk. You can stop using the platform at any time and may ask us to delete your account.",
    ],
  },
  {
    heading: "Disclaimers and liability",
    paragraphs: [
      `The platform is provided "as is" and may sometimes be unavailable. Tutoring sessions are arranged between students and tutors. To the extent allowed by law, ${SITE_NAME} is not responsible for losses that come from a tutoring session, or from a user's actions or content.`,
    ],
  },
  {
    heading: "Changes to these Terms",
    paragraphs: [
      "We may update these Terms. If a change is significant, we will ask you to accept the new version before you continue. The date at the top shows when this version was last updated.",
    ],
  },
  {
    heading: "Governing law",
    paragraphs: ["These Terms are governed by the laws of the Republic of the Philippines."],
  },
  {
    heading: "Contact",
    paragraphs: [`Questions about these Terms? Email us at ${CONTACT_EMAIL}.`],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro={`By creating an account or using ${SITE_NAME}, you agree to these Terms of Service. Please read them together with our Privacy Policy.`}
      sections={SECTIONS}
    />
  );
}

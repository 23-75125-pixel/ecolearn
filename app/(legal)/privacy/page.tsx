import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants/site";

export const metadata: Metadata = { title: `Privacy Policy | ${SITE_NAME}` };

const SECTIONS: LegalSection[] = [
  {
    heading: "Who is responsible for your data",
    paragraphs: [
      `${SITE_NAME} collects and uses your personal data as described here, in line with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). For privacy questions or requests, contact us at ${CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: "What we collect",
    bullets: [
      "Account details: your name, email address, optional phone number, and whether you joined as a student or a tutor. Your password is stored only as a secure hash; we cannot read it.",
      "Google sign-in: if you use Google, we receive your name and email address from Google. We never see your Google password.",
      "Tutor applications: school, degree, major, graduation year, achievements, teaching experience, teaching approach, preferred teaching modes, chosen subjects, and the credential files you upload (for example an ID, diploma or certificate).",
      "Appointments: the slot you booked, the subject, any note you wrote, the status, and a cancellation reason if there is one.",
      "Notifications and activity records: messages sent to you about bookings, and a log of important actions (such as bookings, cancellations and application reviews) used for security.",
    ],
  },
  {
    heading: "Why we use it",
    bullets: [
      "To create and secure your account and let you sign in.",
      "To let administrators verify tutors before they can accept bookings.",
      "To show tutors to students, and to let students book, change and cancel appointments.",
      "To send you notifications and account emails, such as email confirmation and password reset.",
      "To keep the platform safe, investigate misuse, and meet legal obligations.",
    ],
  },
  {
    heading: "Who can see your data",
    bullets: [
      "Everyone: an approved tutor's name, headline, bio, subjects and open time slots.",
      "Tutors: the name and booking note of students who booked with them.",
      "Students: the tutor they booked with and their own appointments.",
      "Administrators: tutor applications, credential files, and the contact details of applicants, so they can review them.",
      "Credential files are stored privately. Only the tutor who uploaded them and administrators can open them.",
      "We do not sell your personal data or use it for advertising.",
    ],
  },
  {
    heading: "Service providers",
    paragraphs: [
      "We use Supabase to host our database, handle sign-in, store files and send account emails, and Google to offer Google sign-in. Your data is processed on their systems only to provide these services to us.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "We use only the cookies needed to keep you signed in. We do not use advertising or tracking cookies.",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "We keep your data while your account is active and for as long as needed for the purposes above, including tutor-verification records and security logs. When you ask us to delete your account, we delete or anonymize your data unless the law requires us to keep it.",
    ],
  },
  {
    heading: "How we protect it",
    paragraphs: [
      "Connections use HTTPS, passwords are hashed, access to data is limited by role at the database level, and credential files are private. No system is perfectly secure, so please use a strong, unique password.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: ["Under the Data Privacy Act you have the right to:"],
    bullets: [
      "be informed about how your data is used;",
      "access the data we hold about you;",
      "object to the processing of your data;",
      "correct inaccurate data;",
      "request that your data be erased or blocked;",
      "receive your data in a commonly used format;",
      "claim compensation if you suffer damages from the misuse of your data.",
    ],
  },
  {
    heading: "Complaints",
    paragraphs: [
      `To use any of these rights, email ${CONTACT_EMAIL}. If you are not satisfied with our response, you may file a complaint with the National Privacy Commission (privacy.gov.ph).`,
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "Students under 18 should use the platform with the knowledge and permission of a parent or guardian.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "We may update this policy. The date at the top shows the latest version, and we will ask you to accept the new version if a change is significant.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro={`This policy explains what personal data ${SITE_NAME} collects, why, and the choices you have.`}
      sections={SECTIONS}
    />
  );
}

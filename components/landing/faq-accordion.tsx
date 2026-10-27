import { ChevronDown } from "lucide-react";
import { BORDER, DIVIDE, ICON, SECTION, SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const FAQS = [
  {
    question: "How are tutors vetted?",
    answer:
      "Every tutor submits an application with their experience, claimed subjects, and supporting credentials. Our admin team reviews each application and only approved tutors appear in the public directory.",
  },
  {
    question: "How does booking work?",
    answer:
      "Tutors publish their weekly availability, and the platform generates bookable slots from it. You pick a slot that fits your week and it's reserved instantly — a slot can never be double-booked.",
  },
  {
    question: "Can I cancel or reschedule a session?",
    answer:
      "Yes. From your dashboard you can cancel any upcoming appointment in one click, which immediately reopens the slot for other students.",
  },
  {
    question: "What subjects are covered?",
    answer:
      "The subject catalog is maintained by our admin team and currently spans Mathematics, Science, English, and Computer Programming, with more added as verified tutors join.",
  },
  {
    question: "How do I become a tutor on Eco Learn?",
    answer:
      "Register with a tutor account, complete the application form, and upload your credentials. You'll be notified as soon as the review is complete.",
  },
];

export function FaqAccordion() {
  return (
    <div className={cn("mx-auto max-w-3xl rounded-md", BORDER, DIVIDE)}>
      {FAQS.map((faq) => (
        <details key={faq.question} className="group px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.01] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown
              aria-hidden="true"
              className={cn(ICON, "transition-all duration-200 ease-in-out group-open:rotate-180")}
            />
          </summary>
          <p className={cn(SUBTEXT, "pb-5 leading-6")}>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className={SUBTEXT}>FAQ</p>
        <h2 className={cn(SECTION, "mt-2")}>Frequently asked questions</h2>
      </div>
      <div className="mt-10">
        <FaqAccordion />
      </div>
    </section>
  );
}

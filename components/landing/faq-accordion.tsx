import { ChevronDown } from "lucide-react";

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
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-[1.5rem] border border-border bg-surface/60">
      {FAQS.map((faq) => (
        <details key={faq.question} className="group px-6 sm:px-8">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown
              size={18}
              className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="pb-5 text-sm leading-7 text-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
      </div>
      <div className="mt-10 sm:mt-12">
        <FaqAccordion />
      </div>
    </section>
  );
}

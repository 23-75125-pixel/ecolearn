import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  UsersRound,
} from "lucide-react";
import { LearningCarousel } from "@/components/landing/learning-carousel";

const STEPS = [
  {
    number: "01",
    icon: UsersRound,
    title: "Choose your guide",
    body: "Browse tutors by subject, experience, and the kind of support you need.",
  },
  {
    number: "02",
    icon: CalendarClock,
    title: "Find your rhythm",
    body: "See real availability and book a focused session that fits your week.",
  },
  {
    number: "03",
    icon: BookOpenCheck,
    title: "Keep moving forward",
    body: "Build confidence through thoughtful teaching and consistent practice.",
  },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-6xl px-0 pb-10 pt-0 sm:px-6 sm:pb-20 sm:pt-8">
        <LearningCarousel />
      </section>

      <section className="border-y border-border bg-surface/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              A calmer way to learn
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Simple steps. Better support.
            </h2>
            <p className="mt-4 leading-7 text-muted">
              From your first search to your next confident answer, every part of Eco Learn
              is designed to keep your attention on progress.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="border-t border-primary-100 pt-5">
                  <div className="flex items-center justify-between">
                    <Icon size={23} className="text-primary-600" />
                    <span className="text-sm font-semibold text-primary-500">{step.number}</span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[1.5rem] bg-primary-700 px-7 py-10 text-white sm:flex-row sm:items-center sm:px-12 sm:py-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-100">
              Your next chapter starts here
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to learn with more confidence?
            </h2>
          </div>
          <Link
            href="/tutors"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Explore tutors
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}

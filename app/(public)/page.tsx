import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ShowcaseMarquee } from "@/components/landing/showcase-marquee";
import { PersonaTabs } from "@/components/landing/persona-tabs";
import { FaqSection } from "@/components/landing/faq-accordion";
import { HeroVisual } from "@/components/landing/hero-visual";
import type { CSSProperties } from "react";

const HEADLINE_WORDS = ["Learn", "anything", "you", "set", "your", "mind", "to."];

const SUBJECT_MARQUEE = [
  "Mathematics",
  "Science",
  "English",
  "Computer Programming",
  "Exam preparation",
  "One-on-one tutoring",
  "Small-group sessions",
  "Homework support",
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified tutor directory",
    body: "Every tutor is reviewed and approved by our admin team before appearing publicly — credentials included.",
    span: "md:col-span-2",
  },
  {
    icon: CalendarClock,
    title: "Live availability",
    body: "Tutors publish weekly schedules; the platform turns them into bookable slots in real time.",
    span: "",
  },
  {
    icon: CalendarCheck,
    title: "Conflict-free booking",
    body: "Slots are reserved atomically — a session can never be double-booked, even at the same moment.",
    span: "",
  },
  {
    icon: Bell,
    title: "Notifications that matter",
    body: "Bookings, changes, and updates land in a single calm inbox for students and tutors alike.",
    span: "",
  },
  {
    icon: LayoutDashboard,
    title: "Role-based dashboards",
    body: "Students, tutors, and admins each get a focused workspace built around exactly what they need.",
    span: "",
  },
  {
    icon: RotateCcw,
    title: "Hassle-free cancellation",
    body: "Cancel an upcoming session in one click and the slot instantly reopens for other learners.",
    span: "md:col-span-2",
  },
];

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl sm:tracking-[-0.02em]">
        {title}
      </h2>
      {body ? <p className="mt-4 leading-7 text-muted">{body}</p> : null}
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    icon: ShieldCheck,
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
      {/* Hero — split layout: staggered copy on the left, animated photo composition on the right */}
      <section className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(60%_50%_at_50%_0%,var(--primary-100)_0%,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-16 lg:pt-24">
          <div className="text-center lg:text-left">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-medium text-foreground shadow-sm">
              <Sparkles size={14} className="text-primary-600" />
              Admin-verified tutors, bookable in minutes
            </span>
            <h1 className="mt-7 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:mt-8 sm:text-5xl sm:leading-[1.05] lg:max-w-none lg:text-6xl xl:text-7xl">
              {HEADLINE_WORDS.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="animate-word-in inline-block"
                  style={{ "--word-delay": `${150 + index * 70}ms` } as CSSProperties}
                >
                  {word}{"\u00A0"}
                </span>
              ))}
            </h1>
            <p className="animate-fade-up mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-muted [animation-delay:700ms] sm:text-lg sm:leading-8 lg:mx-0">
              Eco Learn pairs you with verified tutors, real availability, and calm scheduling — so every session moves you forward.
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:850ms] lg:justify-start">
              <Link href="/tutors" className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-600 px-7 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(20,109,99,0.6)] transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                Find your tutor
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="#how-it-works" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                How it works
              </Link>
            </div>
            <p className="animate-fade-up mt-5 text-xs text-muted [animation-delay:950ms] sm:text-sm">No credit card to browse · Free registration for students</p>
          </div>
          <HeroVisual />
        </div>
        {/* Showcase wall — two slow marquee rows, pause on hover */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ShowcaseMarquee />
        </div>
      </section>

      {/* Trusted-by strip — subjects marquee */}
      <section aria-label="Subjects covered" className="border-y border-border bg-surface/70 py-6">
        <div className="marquee relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex w-max items-center gap-10 pr-10" style={{ "--marquee-duration": "36s" } as CSSProperties}>
            {[...SUBJECT_MARQUEE, ...SUBJECT_MARQUEE].map((subject, index) => (
              <span key={`${subject}-${index}`} aria-hidden={index >= SUBJECT_MARQUEE.length} className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                {subject}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bento feature grid */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading eyebrow="Why Eco Learn" title="Everything a tutoring platform should be." body="Built around one promise: the logistics disappear, so the learning can take center stage." />
        <div className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={`group rounded-[1.25rem] border border-border bg-surface/60 p-7 transition-colors hover:border-primary-100 hover:bg-primary-50/60 ${feature.span}`}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-transform group-hover:scale-105">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-muted">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personas — Melius-style tabbed section */}
      <section className="py-6 sm:py-10">
        <SectionHeading eyebrow="Who it's for" title="One platform. Three very different days." />
        <div className="mt-10 sm:mt-12">
          <PersonaTabs />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-surface/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading eyebrow="A calmer way to learn" title="Simple steps. Better support." body="From your first search to your next confident answer, every part of Eco Learn is designed to keep your attention on progress." />
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

      {/* FAQ */}
      <FaqSection />

      {/* Final CTA — Melius "Don't miss out" moment */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary-700 px-7 py-16 text-center text-white sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_110%,rgba(255,255,255,0.16)_0%,transparent_70%)]" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-100">Your next chapter starts here</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">Ready to learn with more confidence?</h2>
            <p className="mt-4 text-sm leading-7 text-white/85 sm:text-base">Join Eco Learn today — browse verified tutors free, and book your first session in minutes.</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Start learning
                <ArrowRight size={17} />
              </Link>
              <Link href="/tutors" className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Explore tutors first
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

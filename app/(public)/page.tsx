import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  Code2,
  GraduationCap,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  Sigma,
} from "lucide-react";
import { ShowcaseMarquee } from "@/components/landing/showcase-marquee";
import { PersonaTabs } from "@/components/landing/persona-tabs";
import { FaqSection } from "@/components/landing/faq-accordion";
import { HeroVisual } from "@/components/landing/hero-visual";
import { buttonClasses } from "@/components/ui/button";
import { BORDER, BORDER_COLOR, ICON, ICON_INLINE, ITEM_TITLE, SECTION, SUBTEXT, SURFACE, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import type { CSSProperties } from "react";

const HEADLINE_WORDS = ["Learn", "anything", "you", "set", "your", "mind", "to."];

const REAL_WORLD = [
  {
    icon: Sigma,
    title: "The quiz is on Monday",
    body: "Get one-on-one help with the exact topic you're stuck on, before it costs you a grade.",
  },
  {
    icon: GraduationCap,
    title: "Entrance exams are coming",
    body: "Prepare with a tutor who has been through it and can show you what to focus on.",
  },
  {
    icon: Code2,
    title: "You want a skill for work",
    body: "Learn programming by building real things, with someone who reviews your work.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified tutor directory",
    body: "Every tutor is reviewed and approved by our admin team before appearing publicly.",
    span: "md:col-span-2",
  },
  {
    icon: CalendarClock,
    title: "Live availability",
    body: "Tutors publish weekly schedules that become bookable slots.",
    span: "",
  },
  {
    icon: CalendarCheck,
    title: "Conflict-free booking",
    body: "A session can never be double-booked.",
    span: "",
  },
  {
    icon: Bell,
    title: "Notifications that matter",
    body: "Bookings and updates in one inbox.",
    span: "",
  },
  {
    icon: LayoutDashboard,
    title: "Role-based dashboards",
    body: "Students, tutors, and admins each get their own workspace.",
    span: "",
  },
  {
    icon: RotateCcw,
    title: "Hassle-free cancellation",
    body: "Cancel in one click and the slot reopens for others.",
    span: "md:col-span-2",
  },
];

function SectionHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className={SECTION}>{title}</h2>
      {body ? <p className={cn(SUBTEXT, "mt-3 leading-6")}>{body}</p> : null}
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    icon: ShieldCheck,
    title: "Choose your guide",
    body: "Browse tutors by subject and experience.",
  },
  {
    number: "02",
    icon: CalendarClock,
    title: "Find your rhythm",
    body: "See real availability and book a session.",
  },
  {
    number: "03",
    icon: BookOpenCheck,
    title: "Keep moving forward",
    body: "Build confidence through consistent practice.",
  },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero — split layout: staggered copy on the left, photo composition on the right */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-16 lg:pt-24">
          <div className="text-center lg:text-left">
            <h1 className={cn(TITLE, "text-balance")}>
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
            <p className={cn("animate-fade-up mx-auto mt-4 max-w-xl text-pretty leading-6 [animation-delay:700ms] lg:mx-0", SUBTEXT)}>
              Real help for real classroom challenges: homework, exams, and skills you will use long after school.
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:850ms] lg:justify-start">
              <Link href="/tutors" className={buttonClasses({ size: "lg" })}>
                Find your tutor
                <ArrowRight className={ICON_INLINE} />
              </Link>
            </div>
          </div>
          <HeroVisual />
        </div>
        {/* Showcase wall — two slow marquee rows, pause on hover */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ShowcaseMarquee />
        </div>
      </section>

      {/* Real-world message */}
      <section id="real-world" className={cn("border-y", BORDER_COLOR)}>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            title="Learning that works in real life."
            body="Good tutoring is not about perfect slides. It is about the test you have on Monday, the exam you are preparing for, and the skills you want to use tomorrow."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {REAL_WORLD.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={cn("rounded-md p-6", BORDER)}>
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md", BORDER, SURFACE)}>
                    <Icon aria-hidden="true" className={ICON} />
                  </span>
                  <h3 className={cn(ITEM_TITLE, "mt-5")}>{item.title}</h3>
                  <p className={cn(SUBTEXT, "mt-2 leading-6")}>{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeading title="Everything a tutoring platform should be." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={cn("rounded-md p-6", BORDER, feature.span)}>
                <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md", BORDER, SURFACE)}>
                  <Icon aria-hidden="true" className={ICON} />
                </span>
                <h3 className="mt-5 text-sm font-medium">{feature.title}</h3>
                <p className={cn(SUBTEXT, "mt-2 leading-6")}>{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personas — tabbed section */}
      <section className="py-6 sm:py-10">
        <SectionHeading title="One platform. Three very different days." />
        <div className="mt-10">
          <PersonaTabs />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={cn("mt-14 border-y", BORDER_COLOR)}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <SectionHeading title="Simple steps. Better support." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className={cn("rounded-md p-6", BORDER)}>
                  <div className="flex items-center justify-between">
                    <Icon aria-hidden="true" className={ICON} />
                    <span className={SUBTEXT}>{step.number}</span>
                  </div>
                  <h3 className="mt-6 text-sm font-medium">{step.title}</h3>
                  <p className={cn(SUBTEXT, "mt-2 leading-6")}>{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className={cn("rounded-md px-6 py-16 text-center sm:px-12", BORDER, SURFACE)}>
          <div className="mx-auto max-w-xl">
            <h2 className={cn(SECTION, "text-balance")}>Ready to learn with more confidence?</h2>
            <p className={cn(SUBTEXT, "mt-3 leading-6")}>Create a free account and book your first session in minutes.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className={buttonClasses({ size: "lg" })}>
                Start learning
                <ArrowRight className={ICON_INLINE} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

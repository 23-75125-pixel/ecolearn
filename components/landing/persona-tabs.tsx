"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PERSONAS = [
  {
    id: "students",
    label: "Students",
    tagline: "Learn with a guide who gets you.",
    body: "Search the directory, compare real availability, and book a focused session in minutes — no back-and-forth messages, no waiting for a reply.",
    tags: ["Verified tutors", "Live availability", "One-click booking", "Session history", "Cancel anytime"],
    cta: { href: "/tutors", label: "Find a tutor" },
  },
  {
    id: "parents",
    label: "Parents",
    tagline: "Support you can actually trust.",
    body: "Every tutor on Eco Learn is reviewed and approved by our team before they appear in the directory, so you can book with confidence.",
    tags: ["Admin-approved tutors", "Flexible scheduling", "Transparent history", "Simple cancellation"],
    cta: { href: "/register", label: "Create an account" },
  },
  {
    id: "tutors",
    label: "Tutors",
    tagline: "Teach more. Coordinate less.",
    body: "Publish your weekly availability once and let students book the slots that work. Applications are reviewed quickly, then you are live in the directory.",
    tags: ["Guided application", "Availability manager", "Automatic slots", "Bookings & notifications"],
    cta: { href: "/register", label: "Apply as a tutor" },
  },
];

export function PersonaTabs() {
  const [activeId, setActiveId] = useState(PERSONAS[0].id);
  const active = PERSONAS.find((persona) => persona.id === activeId) ?? PERSONAS[0];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div
        role="tablist"
        aria-label="Who Eco Learn is for"
        className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
      >
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            role="tab"
            id={`persona-tab-${persona.id}`}
            aria-selected={activeId === persona.id}
            aria-controls={`persona-panel-${persona.id}`}
            type="button"
            onClick={() => setActiveId(persona.id)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
              activeId === persona.id
                ? "bg-primary-600 text-white"
                : "text-foreground hover:bg-primary-50",
            )}
          >
            {persona.label}
          </button>
        ))}
      </div>

      <div
        key={active.id}
        role="tabpanel"
        id={`persona-panel-${active.id}`}
        aria-labelledby={`persona-tab-${active.id}`}
        className="animate-fade-up mt-12 rounded-[1.75rem] border border-border bg-surface/60 p-8 sm:mt-14 sm:p-12"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              {active.label}
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {active.tagline}
            </h3>
            <p className="mt-4 leading-7 text-muted">{active.body}</p>
            <Link
              href={active.cta.href}
              className="group mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              {active.cta.label}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ul className="flex flex-wrap content-start gap-2.5 lg:justify-end">
            {active.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

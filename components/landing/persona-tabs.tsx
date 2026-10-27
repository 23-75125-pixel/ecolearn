"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { BORDER, INTERACTIVE, SECTION, SUBTEXT, SURFACE } from "@/lib/ui/styles";

const PERSONAS = [
  {
    id: "students",
    label: "Students",
    tagline: "Learn with a guide who gets you.",
    body: "Compare real availability and book a session in minutes.",
    tags: ["Verified tutors", "Live availability", "One-click booking", "Session history", "Cancel anytime"],
  },
  {
    id: "parents",
    label: "Parents",
    tagline: "Support you can actually trust.",
    body: "Every tutor is reviewed and approved by our team before they appear.",
    tags: ["Admin-approved tutors", "Flexible scheduling", "Transparent history", "Simple cancellation"],
  },
  {
    id: "tutors",
    label: "Tutors",
    tagline: "Teach more. Coordinate less.",
    body: "Publish your weekly availability once and let students book.",
    tags: ["Guided application", "Availability manager", "Automatic slots", "Bookings & notifications"],
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
        className={cn("mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-md p-1", BORDER, SURFACE)}
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
              "rounded-md border border-transparent px-4 py-1.5 text-sm font-medium",
              INTERACTIVE,
              activeId === persona.id
                ? "border border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                : "text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50",
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
        className={cn("animate-fade-up mt-10 rounded-md p-8 sm:p-12", BORDER)}
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <h3 className={SECTION}>{active.tagline}</h3>
            <p className={cn(SUBTEXT, "mt-3 leading-6")}>{active.body}</p>
          </div>

          <ul className="flex flex-wrap content-start gap-2 lg:justify-end">
            {active.tags.map((tag) => (
              <li
                key={tag}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium", BORDER, SURFACE)}
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

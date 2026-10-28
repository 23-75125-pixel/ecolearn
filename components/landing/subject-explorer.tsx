"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, BookOpen, Code2, FlaskConical, Sigma, type LucideIcon } from "lucide-react";
import { SubjectArt, type SubjectId } from "@/components/landing/subject-art";
import { buttonClasses } from "@/components/ui/button";
import { BORDER, BORDER_COLOR, ICON, INTERACTIVE, ITEM_TITLE, SECTION, SUBTEXT, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

type Subject = {
  id: SubjectId;
  /** Must match the subject name in the database so the directory filter finds it. */
  name: string;
  icon: LucideIcon;
  summary: string;
  body: string;
  topics: string[];
};

const SUBJECTS: Subject[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    icon: Sigma,
    summary: "Algebra, geometry and exam prep",
    body: "Work through problems step by step with a tutor who shows you where the method matters, not only the answer.",
    topics: ["Algebra", "Geometry", "Trigonometry", "Statistics", "Exam preparation"],
  },
  {
    id: "science",
    name: "Science",
    icon: FlaskConical,
    summary: "Biology, chemistry and physics",
    body: "Understand the idea behind the formula, then practise it with experiments, lab reports and past questions.",
    topics: ["Biology", "Chemistry", "Physics", "Lab reports", "Study groups"],
  },
  {
    id: "english",
    name: "English",
    icon: BookOpen,
    summary: "Reading, writing and speaking",
    body: "Build clear writing and confident speaking, with feedback on the essays and presentations you are working on now.",
    topics: ["Reading comprehension", "Essay writing", "Grammar", "Speaking practice", "Exam preparation"],
  },
  {
    id: "programming",
    name: "Computer Programming",
    icon: Code2,
    summary: "Python, web and problem solving",
    body: "Learn by building small projects, with someone who reviews your code and helps you debug it.",
    topics: ["Python", "Web development", "Problem solving", "Debugging", "Project review"],
  },
];

export function SubjectExplorer() {
  const [activeId, setActiveId] = useState<SubjectId>(SUBJECTS[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = SUBJECTS.findIndex((subject) => subject.id === activeId);
  const active = SUBJECTS[activeIndex];

  function select(index: number) {
    const next = (index + SUBJECTS.length) % SUBJECTS.length;
    setActiveId(SUBJECTS[next].id);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      select(activeIndex + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      select(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(SUBJECTS.length - 1);
    }
  }

  return (
    <section id="subjects" aria-labelledby="subjects-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="subjects-heading" className={SECTION}>
          Find help in the subject you need.
        </h2>
        <p className={cn(SUBTEXT, "mt-3 leading-6")}>Choose a subject to see what our tutors can help you with.</p>
      </div>

      <div className={cn("mt-10 grid overflow-hidden rounded-md lg:grid-cols-[19rem_1fr]", BORDER)}>
        <div
          role="tablist"
          aria-label="Subjects"
          onKeyDown={onKeyDown}
          className={cn("grid grid-cols-2 border-b lg:grid-cols-1 lg:border-b-0 lg:border-r", BORDER_COLOR)}
        >
          {SUBJECTS.map((subject, index) => {
            const Icon = subject.icon;
            const isActive = subject.id === activeId;
            return (
              <button
                key={subject.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`subject-tab-${subject.id}`}
                aria-selected={isActive}
                aria-controls={`subject-panel-${subject.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveId(subject.id)}
                className={cn(
                  "flex items-start gap-3 border-l-2 p-4 text-left sm:p-5",
                  index > 0 && "lg:border-t",
                  index > 0 && BORDER_COLOR,
                  INTERACTIVE,
                  "hover:scale-100",
                  isActive
                    ? "border-l-brand-600 bg-zinc-100/50 dark:border-l-brand-400 dark:bg-zinc-900/50"
                    : "border-l-transparent hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50",
                )}
              >
                <span className={cn("mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md", BORDER, SURFACE)}>
                  <Icon aria-hidden="true" className={cn(ICON, isActive && "text-brand-600 dark:text-brand-400")} />
                </span>
                <span className="min-w-0">
                  <span className={cn("block", ITEM_TITLE, isActive && "text-brand-600 dark:text-brand-400")}>{subject.name}</span>
                  <span className={cn("mt-0.5 hidden text-xs leading-5 text-zinc-500 sm:block dark:text-zinc-400")}>{subject.summary}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          key={active.id}
          role="tabpanel"
          id={`subject-panel-${active.id}`}
          aria-labelledby={`subject-tab-${active.id}`}
          className="animate-fade-up grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[1.05fr_1fr]"
        >
          <div className={cn("aspect-[3/2] w-full overflow-hidden rounded-md", BORDER, SURFACE)}>
            <SubjectArt id={active.id} />
          </div>
          <div>
            <h3 className="text-lg font-medium tracking-tight">{active.name}</h3>
            <p className={cn(SUBTEXT, "mt-2 leading-6")}>{active.body}</p>
            <ul aria-label={`${active.name} topics`} className="mt-5 flex flex-wrap gap-2">
              {active.topics.map((topic) => (
                <li key={topic} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", BORDER, SURFACE)}>
                  {topic}
                </li>
              ))}
            </ul>
            <Link
              href={`/tutors?subject=${encodeURIComponent(active.name)}`}
              className={cn(buttonClasses({ size: "md" }), "mt-7")}
            >
              Find a {active.name} tutor
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 stroke-[1.75]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

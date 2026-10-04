"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BORDER, EMPTY_STATE, ICON, INTERACTIVE, ITEM_TITLE, SUBTEXT, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { unwrapRelation } from "@/lib/utils/relations";

type Relation<T> = T | T[] | null;

type Tutor = {
  id: string;
  headline: string | null;
  bio: string | null;
  profiles: Relation<{ first_name: string; last_name: string }>;
  tutor_subjects: { subjects: Relation<{ name: string }> }[];
};

/** Flattens one tutor row into the plain values the directory needs. */
function toListItem(tutor: Tutor) {
  const profile = unwrapRelation(tutor.profiles);
  const subjectNames = tutor.tutor_subjects
    .map((item) => unwrapRelation(item.subjects)?.name)
    .filter((name): name is string => Boolean(name));
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

  return { tutor, fullName, initial: profile?.first_name?.[0] ?? "?", subjectNames };
}

export function TutorDirectory({ tutors }: { tutors: Tutor[] }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");

  const items = useMemo(() => tutors.map(toListItem), [tutors]);
  const allSubjects = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.subjectNames))).sort(),
    [items],
  );

  const search = query.trim().toLowerCase();
  const visibleItems = items.filter(({ tutor, fullName, subjectNames }) => {
    const searchableText = `${fullName} ${tutor.headline ?? ""} ${tutor.bio ?? ""} ${subjectNames.join(" ")}`.toLowerCase();
    const matchesSearch = searchableText.includes(search);
    const matchesSubject = subject === "all" || subjectNames.includes(subject);
    return matchesSearch && matchesSubject;
  });

  return (
    <>
      <div className={cn("mt-8 grid gap-3 rounded-md p-4 sm:grid-cols-[1fr_12rem]", BORDER, SURFACE)}>
        <label className="relative block">
          <span className="sr-only">Search tutors</span>
          <Search aria-hidden="true" className={cn(ICON, "pointer-events-none absolute left-3 top-3")} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or subject"
            maxLength={100}
            className="pl-10"
          />
        </label>
        <label>
          <span className="sr-only">Filter by subject</span>
          <Select value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option value="all">All subjects</option>
            {allSubjects.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {visibleItems.length === 0 ? (
        <div className={cn(EMPTY_STATE, "mt-8")}>No tutors match those filters.</div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map(({ tutor, fullName, initial, subjectNames }) => (
            <Link key={tutor.id} href={`/tutors/${tutor.id}`} className={cn("block rounded-md", INTERACTIVE)}>
              <Card className="h-full">
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-medium", BORDER, SURFACE)}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className={ITEM_TITLE}>{fullName}</p>
                    <Badge tone="success">Verified tutor</Badge>
                  </div>
                </div>
                {tutor.headline && <p className={cn(ITEM_TITLE, "mt-4")}>{tutor.headline}</p>}
                {tutor.bio && <p className={cn(SUBTEXT, "mt-1 line-clamp-2 leading-6")}>{tutor.bio}</p>}
                {subjectNames.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {subjectNames.map((name) => (
                      <Badge key={name} tone="info">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tutor = {
  id: string;
  headline: string | null;
  bio: string | null;
  profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  tutor_subjects: { subjects: { name: string } | { name: string }[] | null }[];
};

export function TutorDirectory({ tutors }: { tutors: Tutor[] }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const subjects = Array.from(new Set(tutors.flatMap((tutor) => tutor.tutor_subjects.map((item) => { const value = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects; return value?.name; }).filter(Boolean) as string[]))).sort();
  const filteredTutors = tutors.filter((tutor) => {
    const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
    const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.toLowerCase();
    const text = `${name} ${tutor.headline ?? ""} ${tutor.bio ?? ""}`.toLowerCase();
    const tutorSubjects = tutor.tutor_subjects.map((item) => { const value = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects; return value?.name; });
    return text.includes(query.toLowerCase()) && (subject === "all" || tutorSubjects.includes(subject));
  });

  return <>
    <div className="mt-6 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_12rem]">
      <label className="relative block"><span className="sr-only">Search tutors</span><Search size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or subject" className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary-500" /></label>
      <label><span className="sr-only">Filter by subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="all">All subjects</option>{subjects.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
    {filteredTutors.length === 0 ? <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">No tutors match those filters.</div> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredTutors.map((tutor) => { const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles; const names = tutor.tutor_subjects.map((item) => { const value = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects; return value?.name; }).filter(Boolean); return <Link key={tutor.id} href={`/tutors/${tutor.id}`}><Card className="h-full transition-shadow hover:shadow-md"><div className="flex items-center gap-3"><div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">{profile?.first_name?.[0] ?? "?"}</div><div><p className="font-semibold text-foreground">{profile?.first_name} {profile?.last_name}</p><Badge tone="success">Verified tutor</Badge></div></div>{tutor.headline && <p className="mt-3 text-sm font-medium text-foreground">{tutor.headline}</p>}{tutor.bio && <p className="mt-1 line-clamp-2 text-sm text-muted">{tutor.bio}</p>}{names.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{names.map((name) => <Badge key={name} tone="info">{name}</Badge>)}</div>}</Card></Link>; })}</div>}
  </>;
}

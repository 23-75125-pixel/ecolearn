"use client";

import { useActionState } from "react";
import { createSubject, setSubjectActive, type SubjectFormState } from "@/app/admin/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Subject = { id: string; name: string; slug: string; is_active: boolean };

export function SubjectManager({ subjects }: { subjects: Subject[] }) {
  const [createState, createAction, creating] = useActionState(createSubject, null as SubjectFormState);
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Subject catalog</CardTitle>
        <CardDescription>
          Add subjects here. Active subjects appear on the homepage and in tutor dashboards.
        </CardDescription>
      </CardHeader>
      <form action={createAction} className="flex flex-col gap-3 border-b p-6 sm:flex-row">
        <Input name="name" required maxLength={80} placeholder="e.g. Filipino" aria-label="New subject name" />
        <Button type="submit" disabled={creating}>{creating ? "Adding..." : "Add subject"}</Button>
      </form>
      {createState?.error && <Alert>{createState.error}</Alert>}
      {createState?.success && <Alert role="status">{createState.success}</Alert>}
      <ul className="divide-y">
        {subjects.map((subject) => (
          <SubjectRow key={subject.id} subject={subject} />
        ))}
      </ul>
    </Card>
  );
}

function SubjectRow({ subject }: { subject: Subject }) {
  const [state, action, pending] = useActionState(setSubjectActive, null as SubjectFormState);
  return (
    <li className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <p className="font-medium">{subject.name}</p>
        <p className="text-xs text-zinc-500">{subject.slug}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={subject.is_active ? "success" : "neutral"}>{subject.is_active ? "Active" : "Hidden"}</Badge>
        <form action={action}>
          <input type="hidden" name="subjectId" value={subject.id} />
          <input type="hidden" name="isActive" value={String(!subject.is_active)} />
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {subject.is_active ? "Hide" : "Activate"}
          </Button>
        </form>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </li>
  );
}

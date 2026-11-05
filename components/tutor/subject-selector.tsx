"use client";

import { useActionState } from "react";
import { saveTutorSubjects, type TutorFormState } from "@/app/tutor/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { BORDER, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

type Subject = { id: string; name: string };

export function SubjectSelector({
  subjects,
  selectedSubjectIds,
}: {
  subjects: Subject[];
  selectedSubjectIds: string[];
}) {
  const [state, action, pending] = useActionState(saveTutorSubjects, null as TutorFormState);
  const selected = new Set(selectedSubjectIds);
  return (
    <div className="space-y-4">
      <CardDescription>Select the subjects you currently teach. Ask an administrator to add a subject that is not listed.</CardDescription>
      {subjects.length === 0 ? (
        <Alert role="status">No active subjects are available. Please ask an administrator to add one.</Alert>
      ) : (
        <form action={action} className="space-y-4">
          <div className={cn("grid gap-2 rounded-md p-3 sm:grid-cols-2", BORDER, SURFACE)}>
            {subjects.map((subject) => (
              <label key={subject.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input type="checkbox" name="subjectIds" value={subject.id} defaultChecked={selected.has(subject.id)} className="h-4 w-4 accent-brand-600" />
                {subject.name}
              </label>
            ))}
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save subjects"}</Button>
        </form>
      )}
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.success && <Alert role="status">{state.success}</Alert>}
    </div>
  );
}

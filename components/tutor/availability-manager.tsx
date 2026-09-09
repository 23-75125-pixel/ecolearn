"use client";

import { useActionState } from "react";
import { createAvailability, deleteAvailability, type TutorFormState } from "@/app/tutor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionDialog, ConfirmSubmit } from "@/components/ui/action-dialog";

type Subject = { id: string; name: string };
type Availability = { id: string; day_date: string; start_time: string; end_time: string; slot_duration_minutes: number; subject_id: string | null };

export function AvailabilityManager({ availability, subjects }: { availability: Availability[]; subjects: Subject[] }) {
  const [state, action, pending] = useActionState(createAvailability, null as TutorFormState);
  return (
    <div className="space-y-6">
      <form action={action} className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><Label htmlFor="dayDate">Date</Label><Input id="dayDate" name="dayDate" type="date" required /></div>
        <div><Label htmlFor="startTime">Starts</Label><Input id="startTime" name="startTime" type="time" required /></div>
        <div><Label htmlFor="endTime">Ends</Label><Input id="endTime" name="endTime" type="time" required /></div>
        <div><Label htmlFor="duration">Slot length</Label><select id="duration" name="duration" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></div>
        <div><Label htmlFor="subjectId">Subject</Label><select id="subjectId" name="subjectId" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">Any subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
        <div className="sm:col-span-2 lg:col-span-5"><Button type="submit" isLoading={pending}>Add availability</Button>{state?.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}</div>
      </form>
      {availability.length === 0 ? <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted">No availability windows yet.</p> : <ul className="divide-y divide-border rounded-md border border-border">{availability.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium text-foreground">{item.day_date}</p><p className="text-sm text-muted">{item.start_time.slice(0, 5)} to {item.end_time.slice(0, 5)} · {item.slot_duration_minutes}-minute slots</p></div><form action={deleteAvailability}><input type="hidden" name="availabilityId" value={item.id} /><ConfirmSubmit message="Remove this availability window? Any open slots will be removed."><span className="inline-flex h-8 items-center justify-center rounded-md bg-danger px-3 text-sm font-medium text-white hover:opacity-90">Remove</span></ConfirmSubmit></form></li>)}</ul>}
      <ActionDialog error={state?.error} success={state?.success} />
    </div>
  );
}

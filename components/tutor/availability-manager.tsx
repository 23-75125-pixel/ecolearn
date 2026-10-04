"use client";

import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createAvailability, deleteAvailability, type TutorFormState } from "@/app/tutor/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ActionDialog, ConfirmSubmit } from "@/components/ui/action-dialog";
import { BORDER, DIVIDE, EMPTY_STATE, ICON, ICON_INLINE, ITEM_TITLE, SUBTEXT, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { shortTime } from "@/lib/utils/datetime";

type Subject = { id: string; name: string };
type Availability = { id: string; day_date: string; start_time: string; end_time: string; slot_duration_minutes: number; subject_id: string | null };

export function AvailabilityManager({ availability, subjects }: { availability: Availability[]; subjects: Subject[] }) {
  const [state, action, pending] = useActionState(createAvailability, null as TutorFormState);
  return (
    <div className="space-y-6">
      <form action={action} className={cn("grid gap-4 rounded-md p-4 sm:grid-cols-2 lg:grid-cols-5", BORDER, SURFACE)}>
        <div><Label htmlFor="dayDate">Date</Label><Input id="dayDate" name="dayDate" type="date" required /></div>
        <div><Label htmlFor="startTime">Starts</Label><Input id="startTime" name="startTime" type="time" required /></div>
        <div><Label htmlFor="endTime">Ends</Label><Input id="endTime" name="endTime" type="time" required /></div>
        <div>
          <Label htmlFor="duration">Slot length</Label>
          <Select id="duration" name="duration">
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="subjectId">Subject</Label>
          <Select id="subjectId" name="subjectId">
            <option value="">Any subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </Select>
        </div>
        <div className="space-y-3 sm:col-span-2 lg:col-span-5">
          <Button type="submit" isLoading={pending}>
            {!pending && <Plus className={ICON_INLINE} />}
            Add availability
          </Button>
          {state?.error && <Alert>{state.error}</Alert>}
        </div>
      </form>
      {availability.length === 0 ? (
        <p className={EMPTY_STATE}>No availability windows yet.</p>
      ) : (
        <ul className={cn("rounded-md", BORDER, DIVIDE)}>
          {availability.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className={ITEM_TITLE}>{item.day_date}</p>
                <p className={SUBTEXT}>{shortTime(item.start_time)} to {shortTime(item.end_time)} · {item.slot_duration_minutes}-minute slots</p>
              </div>
              <form action={deleteAvailability}>
                <input type="hidden" name="availabilityId" value={item.id} />
                <ConfirmSubmit
                  message="Remove this availability window? Any open slots will be removed."
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  <Trash2 className={ICON} />
                  Remove
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      )}
      <ActionDialog error={state?.error} success={state?.success} />
    </div>
  );
}

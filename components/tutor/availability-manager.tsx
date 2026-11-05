"use client";

import { useActionState, useState } from "react";
import { MapPin, Plus, Trash2, Video } from "lucide-react";
import {
  createAvailability,
  deleteAvailability,
  type TutorFormState,
} from "@/app/tutor/actions";
import { Alert } from "@/components/ui/alert";
import { ActionDialog } from "@/components/ui/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { BORDER, DIVIDE, EMPTY_STATE, ICON, ICON_INLINE, ITEM_TITLE, SUBTEXT, SURFACE } from "@/lib/ui/styles";
import { SLOT_LENGTH_OPTIONS } from "@/lib/validations/tutor";
import { cn } from "@/lib/utils/cn";
import { formatSlotDate, formatTimeRange } from "@/lib/utils/datetime";
import type { SessionMode } from "@/types/database.types";

type Subject = { id: string; name: string };
type Availability = {
  id: string;
  day_date: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  subject_id: string | null;
  session_mode: SessionMode;
  meeting_url: string | null;
  location: string | null;
};

export function AvailabilityManager({ availability, subjects }: { availability: Availability[]; subjects: Subject[] }) {
  const [state, action, pending] = useActionState(createAvailability, null as TutorFormState);
  const [mode, setMode] = useState<SessionMode>("online");

  return (
    <div className="space-y-6">
      <form
        action={action}
        aria-label="Add availability"
        className={cn("grid min-w-0 grid-cols-1 gap-4 rounded-md p-4 sm:grid-cols-2", BORDER, SURFACE)}
      >
        <div className="min-w-0">
          <Label htmlFor="dayDate">Date</Label>
          <Input id="dayDate" name="dayDate" type="date" required className="min-w-0" />
        </div>
        <div className="min-w-0">
          <Label htmlFor="duration">Session length</Label>
          <Select id="duration" name="duration" defaultValue="60">
            {SLOT_LENGTH_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0">
          <Label htmlFor="startTime">Starts</Label>
          <Input id="startTime" name="startTime" type="time" step={900} required />
        </div>
        <div className="min-w-0">
          <Label htmlFor="endTime">Ends</Label>
          <Input id="endTime" name="endTime" type="time" step={900} required />
        </div>

        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">How will you teach?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: "online", label: "Online", hint: "Students join your meeting link", Icon: Video },
                { value: "in_person", label: "In person", hint: "Students meet you at a place", Icon: MapPin },
              ] as const
            ).map(({ value, label, hint, Icon }) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md p-3 text-sm",
                  BORDER,
                  mode === value && "border-brand-600 dark:border-brand-400",
                )}
              >
                <input
                  type="radio"
                  name="sessionMode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="mt-1"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon aria-hidden="true" className={ICON} />
                    {label}
                  </span>
                  <span className={SUBTEXT}>{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "online" ? (
          <div className="min-w-0 sm:col-span-2">
            <Label htmlFor="meetingUrl">Meeting link</Label>
            <Input
              id="meetingUrl"
              name="meetingUrl"
              type="url"
              inputMode="url"
              placeholder="https://meet.google.com/..."
              maxLength={500}
              required
            />
            <p className={cn(SUBTEXT, "mt-1")}>
              Google Meet, Zoom, Teams or any https link. Students see it only after you confirm their booking.
            </p>
          </div>
        ) : (
          <div className="min-w-0 sm:col-span-2">
            <Label htmlFor="location">Meeting place</Label>
            <Input id="location" name="location" placeholder="Library, study room 2" minLength={3} maxLength={200} required />
          </div>
        )}

        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="subjectId">Subject</Label>
          <Select id="subjectId" name="subjectId" className="min-w-0">
            <option value="">Any subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-3 sm:col-span-2">
          <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
            {!pending && <Plus className={ICON_INLINE} />}
            Add availability
          </Button>
          {state?.error && <Alert role="alert">{state.error}</Alert>}
        </div>
      </form>

      {availability.length === 0 ? (
        <p className={EMPTY_STATE}>No availability windows yet.</p>
      ) : (
        <ul className={cn("rounded-md", BORDER, DIVIDE)}>
          {availability.map((item) => (
            <AvailabilityItem key={item.id} item={item} />
          ))}
        </ul>
      )}
      <ActionDialog success={state?.success} />
    </div>
  );
}

function AvailabilityItem({ item }: { item: Availability }) {
  const [state, action, pending] = useActionState(deleteAvailability, null);
  const online = item.session_mode === "online";

  return (
    <li data-testid="availability-window" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className={ITEM_TITLE}>{formatSlotDate(item.day_date)}</p>
        <p className={SUBTEXT}>
          {formatTimeRange(item.start_time, item.end_time)} - {item.slot_duration_minutes}-minute sessions
        </p>
        <p className={cn(SUBTEXT, "break-words")}>
          {online ? `Online - ${item.meeting_url ?? "no meeting link set"}` : `In person - ${item.location ?? "no place set"}`}
        </p>
        {state?.error && <Alert className="mt-2">{state.error}</Alert>}
      </div>
      <form action={action} className="self-start">
        <input type="hidden" name="availabilityId" value={item.id} />
        <Button type="submit" size="sm" variant="secondary" isLoading={pending}>
          {!pending && <Trash2 aria-hidden="true" className={ICON_INLINE} />}
          Remove
        </Button>
      </form>
    </li>
  );
}

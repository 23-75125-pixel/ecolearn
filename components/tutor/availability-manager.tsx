"use client";

import { useActionState, useState } from "react";
import { Check, ChevronDown, Clock3, Plus, Trash2 } from "lucide-react";
import { createAvailability, deleteAvailability, type TutorFormState } from "@/app/tutor/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ActionDialog, ConfirmSubmit } from "@/components/ui/action-dialog";
import {
  BORDER,
  DIVIDE,
  EMPTY_STATE,
  ICON,
  ICON_INLINE,
  ITEM_TITLE,
  SUBTEXT,
  SURFACE,
} from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { shortTime } from "@/lib/utils/datetime";

type Subject = { id: string; name: string };
type Availability = { id: string; day_date: string; start_time: string; end_time: string; slot_duration_minutes: number; subject_id: string | null };

export function AvailabilityManager({ availability, subjects }: { availability: Availability[]; subjects: Subject[] }) {
  const [state, action, pending] = useActionState(createAvailability, null as TutorFormState);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const duration = getDurationMinutes(startTime, endTime);

  return (
    <div className="space-y-6">
      <form action={action} className={cn("grid min-w-0 grid-cols-1 gap-4 rounded-md p-4 sm:grid-cols-2", BORDER, SURFACE)}>
        <div className="min-w-0">
          <Label htmlFor="dayDate">Date</Label>
          <Input id="dayDate" name="dayDate" type="date" required className="min-w-0" />
        </div>
        <div className="min-w-0">
          <Label htmlFor="startTime">Starts</Label>
          <TimePickerInput
            id="startTime"
            name="startTime"
            value={startTime}
            onChange={setStartTime}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="endTime">Ends</Label>
          <TimePickerInput
            id="endTime"
            name="endTime"
            value={endTime}
            onChange={setEndTime}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="duration">Slot length</Label>
          <input type="hidden" name="duration" value={duration ?? ""} />
          <div
            id="duration"
            aria-live="polite"
            className={cn(
              "flex h-10 items-center rounded-md border px-3 text-sm",
              BORDER,
              duration ? "text-zinc-900 dark:text-zinc-50" : SUBTEXT,
            )}
          >
            {duration ? formatDuration(duration) : "Choose start and end times"}
          </div>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="subjectId">Subject</Label>
          <Select id="subjectId" name="subjectId" className="min-w-0">
            <option value="">Any subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
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
            <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={ITEM_TITLE}>{item.day_date}</p>
                <p className={SUBTEXT}>{shortTime(item.start_time)} to {shortTime(item.end_time)} · {item.slot_duration_minutes}-minute slots</p>
              </div>
              <form action={deleteAvailability} className="self-start sm:self-auto">
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

function TimePickerInput({
  id,
  name,
  value,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} required />
      <TimePickerButton
        id={id}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function TimePickerButton({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value ? formatClockTime(value) : "Choose time";

  return (
    <>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${id === "startTime" ? "Start" : "End"} time: ${label}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-transparent px-3 text-left text-sm",
          BORDER,
          "hover:border-zinc-400 dark:hover:border-zinc-500",
          value ? "text-zinc-900 dark:text-zinc-50" : SUBTEXT,
        )}
      >
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Available times"
          className={cn(
            "absolute left-0 top-12 z-20 w-full min-w-56 rounded-md border p-2 shadow-lg",
            BORDER,
            "bg-white dark:bg-zinc-950",
          )}
        >
          <p className={cn(SUBTEXT, "px-2 pb-2 text-xs")}>Choose a time</p>
          <div className="grid max-h-60 grid-cols-3 gap-1 overflow-y-auto">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md px-2 py-2 text-xs",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  value === option && "bg-zinc-100 font-medium dark:bg-zinc-900",
                )}
              >
                {value === option && <Check aria-hidden="true" className="h-3 w-3" />}
                {formatClockTime(option)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4).toString().padStart(2, "0");
  const minutes = ((index % 4) * 15).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});

function formatClockTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function getDurationMinutes(start: string, end: string) {
  if (!start || !end) return null;
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  const difference =
    endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  return difference > 0 ? difference : null;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${remainingMinutes}m`;
}

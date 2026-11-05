import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from "@/lib/constants/status";
import { isExpiredRequest } from "@/lib/appointments/rules";
import { appTimeToDate } from "@/lib/utils/datetime";
import { unwrapRelation } from "@/lib/utils/relations";
import type { AppointmentStatus, SessionMode } from "@/types/database.types";

/** One appointment, flattened for the screen. Plain values only, so it can be passed to client components. */
export type AppointmentView = {
  id: string;
  status: AppointmentStatus;
  /** True when the tutor never confirmed and the session time has passed. */
  expired: boolean;
  slotDate: string;
  startTime: string;
  endTime: string;
  /** ISO time of the session start, for rules that depend on "now". */
  startsAtIso: string;
  /** The tutor (seen by a student) or the student (seen by a tutor). */
  otherPartyName: string;
  subjectName: string | null;
  studentNotes: string | null;
  sessionMode: SessionMode;
  meetingUrl: string | null;
  location: string | null;
  cancellationReason: string | null;
};

type Relation<T> = T | T[] | null;

/** The shape both appointment queries select. */
export type AppointmentRow = {
  id: string;
  status: AppointmentStatus;
  notes: string | null;
  session_mode: SessionMode;
  meeting_url: string | null;
  location: string | null;
  cancellation_reason: string | null;
  appointment_slots: Relation<{ slot_date: string; start_time: string; end_time: string }>;
  subjects: Relation<{ name: string }>;
};

function fullName(person: { first_name: string; last_name: string } | null) {
  return person ? `${person.first_name} ${person.last_name}`.trim() : "";
}

export function toAppointmentView(
  row: AppointmentRow,
  otherParty: { first_name: string; last_name: string } | null,
  now: Date = new Date(),
): AppointmentView | null {
  const slot = unwrapRelation(row.appointment_slots);
  if (!slot) return null;
  const startsAt = appTimeToDate(slot.slot_date, slot.start_time);

  return {
    id: row.id,
    status: row.status,
    expired: isExpiredRequest(row.status, startsAt, now),
    slotDate: slot.slot_date,
    startTime: slot.start_time,
    endTime: slot.end_time,
    startsAtIso: startsAt.toISOString(),
    otherPartyName: fullName(otherParty) || "Name unavailable",
    subjectName: unwrapRelation(row.subjects)?.name ?? null,
    studentNotes: row.notes,
    sessionMode: row.session_mode,
    meetingUrl: row.meeting_url,
    location: row.location,
    cancellationReason: row.cancellation_reason,
  };
}

/** Appointments still ahead of the user, soonest first. Everything else is history, newest first. */
export function splitAppointments(views: AppointmentView[]) {
  const isUpcoming = (view: AppointmentView) =>
    (view.status === "scheduled" || view.status === "confirmed") && !view.expired;
  const byStart = (a: AppointmentView, b: AppointmentView) => a.startsAtIso.localeCompare(b.startsAtIso);

  return {
    upcoming: views.filter(isUpcoming).sort(byStart),
    history: views.filter((view) => !isUpcoming(view)).sort((a, b) => byStart(b, a)),
  };
}

export function statusLabel(view: Pick<AppointmentView, "status" | "expired">): string {
  return view.expired ? "Not confirmed in time" : APPOINTMENT_STATUS_LABEL[view.status];
}

export function statusTone(view: Pick<AppointmentView, "status" | "expired">) {
  return view.expired ? "warning" : APPOINTMENT_STATUS_TONE[view.status];
}

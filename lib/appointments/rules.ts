import type { AppointmentStatus } from "@/types/database.types";

/** Students must cancel at least this long before the session starts (also enforced in cancel_appointment()). */
export const STUDENT_CANCEL_NOTICE_HOURS = 2;
/** A tutor may mark a no-show only this long after the start time (also enforced in the database). */
export const NO_SHOW_WAIT_MINUTES = 15;

export type AppointmentActor = "student" | "tutor";

export type AppointmentActions = {
  canConfirm: boolean;
  canComplete: boolean;
  canMarkNoShow: boolean;
  canCancel: boolean;
  /** Why a student can no longer cancel, when that is the reason. */
  cancelBlockedReason: string | null;
};

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/**
 * Which buttons to offer on an appointment. This only decides what the screen
 * shows: the SQL functions (confirm_appointment, complete_appointment,
 * mark_appointment_no_show, cancel_appointment) re-check every one of these
 * rules, so a changed page can never bypass them.
 */
export function getAppointmentActions(input: {
  actor: AppointmentActor;
  status: AppointmentStatus;
  startsAt: Date;
  now?: Date;
}): AppointmentActions {
  const { actor, status, startsAt, now = new Date() } = input;
  const msUntilStart = startsAt.getTime() - now.getTime();
  const started = msUntilStart <= 0;
  const active = status === "scheduled" || status === "confirmed";
  const isTutor = actor === "tutor";

  const studentTooLate = actor === "student" && msUntilStart < STUDENT_CANCEL_NOTICE_HOURS * HOUR_MS;
  const canCancel = active && !started && !studentTooLate;

  return {
    canConfirm: isTutor && status === "scheduled" && !started,
    canComplete: isTutor && status === "confirmed" && started,
    canMarkNoShow: isTutor && status === "confirmed" && -msUntilStart >= NO_SHOW_WAIT_MINUTES * MINUTE_MS,
    canCancel,
    cancelBlockedReason:
      active && !started && studentTooLate
        ? `Cancelling closes ${STUDENT_CANCEL_NOTICE_HOURS} hours before the session starts.`
        : null,
  };
}

/** A request the tutor never confirmed, whose time has now passed. */
export function isExpiredRequest(status: AppointmentStatus, startsAt: Date, now: Date = new Date()): boolean {
  return status === "scheduled" && startsAt.getTime() <= now.getTime();
}

/**
 * Appointment times are stored without a time zone, so the whole app reads
 * them as Philippine local time. The database uses the same zone in
 * `slot_starts_at()` (see migration 0004).
 */
const UTC_OFFSET = "+08:00";

/** Today's date in the app time zone as YYYY-MM-DD. */
export function todayInAppTimeZone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

/** Turns a form's date ("2026-10-05") and time ("09:00") into a real moment. */
export function appTimeToDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${UTC_OFFSET}`);
}

/** "09:00:00" -> "09:00" */
export function shortTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Appointment times are stored without a time zone, so the whole app reads
 * them as Philippine local time. The database uses the same zone in
 * `slot_starts_at()` (see migration 0004).
 */
export const APP_TIME_ZONE = "Asia/Manila";
const UTC_OFFSET = "+08:00";

/** Today's date in the app time zone as YYYY-MM-DD. */
export function todayInAppTimeZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(now);
}

/** The current clock time in the app time zone as HH:MM. */
export function timeNowInAppTimeZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

/** Turns a form's date ("2026-10-05") and time ("09:00" or "09:00:00") into a real moment. */
export function appTimeToDate(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00${UTC_OFFSET}`);
}

/** "09:00:00" -> "09:00" */
export function shortTime(time: string): string {
  return time.slice(0, 5);
}

/** "13:30:00" -> "1:30 PM" */
export function formatClock(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** "2026-10-30" -> "Fri, Oct 30, 2026". The date has no zone, so it is read as UTC to avoid a day shift. */
export function formatSlotDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "09:00:00", "10:00:00" -> "9:00 AM to 10:00 AM" */
export function formatTimeRange(start: string, end: string): string {
  return `${formatClock(start)} to ${formatClock(end)}`;
}

import { describe, expect, it } from "vitest";
import { getAppointmentActions, isExpiredRequest } from "@/lib/appointments/rules";
import { splitAppointments, toAppointmentView, type AppointmentRow } from "@/lib/appointments/view";
import type { AppointmentStatus } from "@/types/database.types";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const NOW = new Date("2026-10-30T00:00:00Z");
const startsIn = (ms: number) => new Date(NOW.getTime() + ms);

function actions(actor: "student" | "tutor", status: AppointmentStatus, ms: number) {
  return getAppointmentActions({ actor, status, startsAt: startsIn(ms), now: NOW });
}

describe("student cancellation (needs 2 hours notice)", () => {
  it("is open well before the session", () => {
    expect(actions("student", "scheduled", 5 * HOUR).canCancel).toBe(true);
    expect(actions("student", "confirmed", 2 * HOUR).canCancel).toBe(true);
  });

  it("closes inside the last 2 hours and says why", () => {
    const result = actions("student", "confirmed", 119 * MINUTE);
    expect(result.canCancel).toBe(false);
    expect(result.cancelBlockedReason).toMatch(/2 hours/);
  });

  it("is closed once the session started, finished or was cancelled", () => {
    expect(actions("student", "confirmed", -MINUTE).canCancel).toBe(false);
    expect(actions("student", "completed", 5 * HOUR).canCancel).toBe(false);
    expect(actions("student", "cancelled", 5 * HOUR).canCancel).toBe(false);
    expect(actions("student", "no_show", 5 * HOUR).canCancel).toBe(false);
  });

  it("never lets a student confirm, complete or mark a no-show", () => {
    const result = actions("student", "confirmed", -HOUR);
    expect(result).toMatchObject({ canConfirm: false, canComplete: false, canMarkNoShow: false });
  });
});

describe("tutor actions", () => {
  it("can confirm a new request before it starts, once", () => {
    expect(actions("tutor", "scheduled", HOUR).canConfirm).toBe(true);
    expect(actions("tutor", "confirmed", HOUR).canConfirm).toBe(false);
    expect(actions("tutor", "scheduled", -MINUTE).canConfirm).toBe(false);
  });

  it("can cancel any time before the start, even inside 2 hours", () => {
    expect(actions("tutor", "confirmed", 30 * MINUTE).canCancel).toBe(true);
    expect(actions("tutor", "confirmed", -MINUTE).canCancel).toBe(false);
  });

  it("can complete a confirmed session only after it starts", () => {
    expect(actions("tutor", "confirmed", HOUR).canComplete).toBe(false);
    expect(actions("tutor", "confirmed", -MINUTE).canComplete).toBe(true);
    expect(actions("tutor", "scheduled", -MINUTE).canComplete).toBe(false);
  });

  it("can mark a no-show only 15 minutes after the start", () => {
    expect(actions("tutor", "confirmed", -14 * MINUTE).canMarkNoShow).toBe(false);
    expect(actions("tutor", "confirmed", -15 * MINUTE).canMarkNoShow).toBe(true);
  });
});

describe("isExpiredRequest", () => {
  it("flags an unconfirmed request whose time has passed", () => {
    expect(isExpiredRequest("scheduled", startsIn(-MINUTE), NOW)).toBe(true);
    expect(isExpiredRequest("scheduled", startsIn(HOUR), NOW)).toBe(false);
    expect(isExpiredRequest("confirmed", startsIn(-HOUR), NOW)).toBe(false);
  });
});

function row(id: string, status: AppointmentStatus, slotDate: string, startTime: string): AppointmentRow {
  return {
    id,
    status,
    notes: null,
    session_mode: "online",
    meeting_url: "https://meet.example.com/x",
    location: null,
    cancellation_reason: null,
    appointment_slots: { slot_date: slotDate, start_time: startTime, end_time: "23:00:00" },
    subjects: { name: "Mathematics" },
  };
}

describe("toAppointmentView and splitAppointments", () => {
  const tutor = { first_name: "Liza", last_name: "Fernandez" };
  // 2026-10-30 00:00 UTC is 08:00 in Manila.
  const views = [
    row("late", "confirmed", "2026-11-02", "10:00:00"),
    row("soon", "scheduled", "2026-10-31", "09:00:00"),
    row("done", "completed", "2026-10-20", "09:00:00"),
    row("old-request", "scheduled", "2026-10-29", "09:00:00"),
    row("gone", "cancelled", "2026-11-05", "09:00:00"),
  ].flatMap((r) => {
    const view = toAppointmentView(r, tutor, NOW);
    return view ? [view] : [];
  });

  it("flattens the row and names the other person", () => {
    expect(views[0]).toMatchObject({ otherPartyName: "Liza Fernandez", subjectName: "Mathematics", sessionMode: "online" });
  });

  it("puts live appointments first (soonest first) and everything else in history (newest first)", () => {
    const { upcoming, history } = splitAppointments(views);
    expect(upcoming.map((v) => v.id)).toEqual(["soon", "late"]);
    expect(history.map((v) => v.id)).toEqual(["gone", "old-request", "done"]);
  });

  it("marks an unconfirmed request in the past as expired", () => {
    expect(views.find((v) => v.id === "old-request")?.expired).toBe(true);
  });

  it("skips a row with no slot", () => {
    expect(toAppointmentView({ ...row("x", "scheduled", "2026-11-01", "09:00:00"), appointment_slots: null }, tutor, NOW)).toBeNull();
  });
});

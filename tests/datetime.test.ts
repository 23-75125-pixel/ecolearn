import { describe, expect, it } from "vitest";
import {
  appTimeToDate,
  formatClock,
  formatSlotDate,
  formatTimeRange,
  shortTime,
  timeNowInAppTimeZone,
  todayInAppTimeZone,
} from "@/lib/utils/datetime";

describe("todayInAppTimeZone", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayInAppTimeZone()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses the Philippine date, not the machine's", () => {
    // 20:00 UTC on Oct 5 is already 04:00 on Oct 6 in Manila (UTC+8).
    expect(todayInAppTimeZone(new Date("2026-10-05T20:00:00Z"))).toBe("2026-10-06");
    expect(todayInAppTimeZone(new Date("2026-10-05T10:00:00Z"))).toBe("2026-10-05");
  });
});

describe("timeNowInAppTimeZone", () => {
  it("returns the Philippine clock time", () => {
    expect(timeNowInAppTimeZone(new Date("2026-10-05T20:30:00Z"))).toBe("04:30");
    expect(timeNowInAppTimeZone(new Date("2026-10-05T16:00:00Z"))).toBe("00:00");
  });
});

// The tests compare real moments (not getHours()), so they pass on any machine time zone.
describe("appTimeToDate", () => {
  it("reads a date and time as Philippine time", () => {
    expect(appTimeToDate("2026-10-05", "09:00").toISOString()).toBe("2026-10-05T01:00:00.000Z");
  });

  it("accepts HH:MM:SS from the database", () => {
    expect(appTimeToDate("2026-12-25", "23:59:00").toISOString()).toBe("2026-12-25T15:59:00.000Z");
  });

  it("handles midnight", () => {
    expect(appTimeToDate("2026-01-01", "00:00").toISOString()).toBe("2025-12-31T16:00:00.000Z");
  });
});

describe("shortTime", () => {
  it("truncates seconds from HH:MM:SS", () => {
    expect(shortTime("09:00:00")).toBe("09:00");
    expect(shortTime("23:59:59")).toBe("23:59");
  });
});

describe("formatClock", () => {
  it("formats 12-hour clock times", () => {
    expect(formatClock("00:00:00")).toBe("12:00 AM");
    expect(formatClock("09:05:00")).toBe("9:05 AM");
    expect(formatClock("12:00:00")).toBe("12:00 PM");
    expect(formatClock("13:30:00")).toBe("1:30 PM");
    expect(formatClock("23:59:00")).toBe("11:59 PM");
  });
});

describe("formatSlotDate", () => {
  it("does not shift the day, whatever the machine's time zone", () => {
    expect(formatSlotDate("2026-10-30")).toBe("Fri, Oct 30, 2026");
    expect(formatSlotDate("2026-01-01")).toBe("Thu, Jan 1, 2026");
  });
});

describe("formatTimeRange", () => {
  it("joins two clock times", () => {
    expect(formatTimeRange("09:00:00", "10:30:00")).toBe("9:00 AM to 10:30 AM");
  });
});

import { describe, expect, it } from "vitest";
import { appTimeToDate, shortTime, todayInAppTimeZone } from "@/lib/utils/datetime";

describe("todayInAppTimeZone", () => {
  it("returns a YYYY-MM-DD string", () => {
    const result = todayInAppTimeZone();
    expect(/^\d{4}-\d{2}-\d{2}$/.test(result)).toBe(true);
  });

  it("returns a valid date string", () => {
    const result = todayInAppTimeZone();
    expect(new Date(result).toString()).not.toBe("Invalid Date");
  });
});

describe("appTimeToDate", () => {
  it("combines date and time into a Date object", () => {
    const result = appTimeToDate("2026-10-05", "09:00");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(9); // October is month 9 (0-indexed)
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });

  it("handles different times", () => {
    const result = appTimeToDate("2026-12-25", "23:59");
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it("handles midnight", () => {
    const result = appTimeToDate("2026-01-01", "00:00");
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe("shortTime", () => {
  it("truncates seconds from HH:MM:SS", () => {
    expect(shortTime("09:00:00")).toBe("09:00");
    expect(shortTime("14:30:00")).toBe("14:30");
    expect(shortTime("23:59:59")).toBe("23:59");
  });

  it("handles single-digit hours", () => {
    expect(shortTime("09:05:00")).toBe("09:05");
  });
});
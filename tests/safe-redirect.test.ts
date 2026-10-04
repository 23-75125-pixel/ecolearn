import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

describe("safeRedirectPath", () => {
  const fallback = "/student/dashboard";

  it("keeps normal same-site paths", () => {
    expect(safeRedirectPath("/student/dashboard", fallback)).toBe("/student/dashboard");
    expect(safeRedirectPath("/tutors?subject=math", fallback)).toBe("/tutors?subject=math");
  });

  it("rejects links that leave the site", () => {
    expect(safeRedirectPath("//evil.com", fallback)).toBe(fallback);
    expect(safeRedirectPath("/\\evil.com", fallback)).toBe(fallback);
    expect(safeRedirectPath("https://evil.com", fallback)).toBe(fallback);
    expect(safeRedirectPath("javascript:alert(1)", fallback)).toBe(fallback);
  });

  it("falls back for missing or non-string values", () => {
    expect(safeRedirectPath(null, fallback)).toBe(fallback);
    expect(safeRedirectPath(undefined, fallback)).toBe(fallback);
    expect(safeRedirectPath(42, fallback)).toBe(fallback);
  });
});

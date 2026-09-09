import { describe, expect, it } from "vitest";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_MESSAGE,
  APPOINTMENT_STATUS_LABEL,
} from "@/lib/constants/status";

describe("status presentation", () => {
  it("has a user-facing label and message for every application status", () => {
    for (const status of Object.keys(APPLICATION_STATUS_LABEL)) {
      expect(APPLICATION_STATUS_LABEL[status as keyof typeof APPLICATION_STATUS_LABEL]).toBeTruthy();
      expect(APPLICATION_STATUS_MESSAGE[status as keyof typeof APPLICATION_STATUS_MESSAGE]).toBeTruthy();
    }
  });

  it("labels all appointment outcomes", () => {
    expect(Object.keys(APPOINTMENT_STATUS_LABEL)).toEqual(
      expect.arrayContaining(["scheduled", "confirmed", "completed", "cancelled", "no_show"]),
    );
  });
});
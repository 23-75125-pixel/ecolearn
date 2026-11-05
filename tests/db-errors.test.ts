import { describe, expect, it } from "vitest";
import { friendlyDatabaseMessage } from "@/lib/utils/db-errors";

describe("friendlyDatabaseMessage", () => {
  it("shows the message of a business rule (raise exception)", () => {
    expect(friendlyDatabaseMessage({ code: "P0001", message: "This slot is no longer available. Please choose another time." })).toBe(
      "This slot is no longer available. Please choose another time.",
    );
  });

  it("keeps messages that contain a colon intact", () => {
    expect(friendlyDatabaseMessage({ code: "P0001", message: "Reason: because" })).toBe("Reason: because");
  });

  it("hides internal errors behind the fallback", () => {
    expect(friendlyDatabaseMessage({ code: "23505", message: 'duplicate key value violates unique constraint "x"' }, "Try again.")).toBe("Try again.");
    expect(friendlyDatabaseMessage({ code: "PGRST201", message: "Could not embed" })).toBe("Something went wrong. Please try again.");
  });

  it("explains a missing permission", () => {
    expect(friendlyDatabaseMessage({ code: "42501", message: "permission denied for table appointments" })).toBe("You are not allowed to do that.");
  });
});

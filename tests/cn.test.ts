import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("combines conditional class values", () => {
    expect(cn("text-sm", false && "hidden", { "font-semibold": true })).toBe("text-sm font-semibold");
  });
});
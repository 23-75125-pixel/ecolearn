import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("combines class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles a single input", () => {
    expect(cn("only")).toBe("only");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, "b", null, undefined, 0, "c")).toBe("a b c");
  });

  it("handles nested arrays", () => {
    expect(cn("a", ["b", "c"])).toBe("a b c");
  });

  it("handles objects with boolean values", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });
});
import { describe, expect, it } from "vitest";
import { unwrapRelation } from "@/lib/utils/relations";

describe("unwrapRelation", () => {
  it("returns the object as-is when given an object", () => {
    expect(unwrapRelation({ id: "1", name: "Test" })).toEqual({ id: "1", name: "Test" });
  });

  it("returns null when given null", () => {
    expect(unwrapRelation(null)).toBe(null);
  });

  it("returns null when given undefined", () => {
    expect(unwrapRelation(undefined)).toBe(null);
  });

  it("unwraps a single-element array to its first element", () => {
    expect(unwrapRelation([{ id: "1" }])).toEqual({ id: "1" });
  });

  it("returns null when given an empty array", () => {
    expect(unwrapRelation([])).toBe(null);
  });

  it("unwraps a multi-element array to its first element", () => {
    expect(unwrapRelation([{ id: "1" }, { id: "2" }])).toEqual({ id: "1" });
  });
});
import { describe, expect, it } from "vitest";
import { parseUuid, parseUuidList, emptyToUndefined } from "@/lib/validations/common";

describe("parseUuid", () => {
  it("returns valid UUIDs", () => {
    const form = new FormData();
    form.set("key", "3f2504e0-4f89-41d3-9a0c-0305e82c3301");
    expect(parseUuid(form, "key")).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });

  it("returns null for invalid UUIDs", () => {
    const form = new FormData();
    form.set("key", "not-a-uuid");
    expect(parseUuid(form, "key")).toBeNull();
  });

  it("returns null for missing keys", () => {
    const form = new FormData();
    expect(parseUuid(form, "missing")).toBeNull();
  });

  it("returns null for SQL injection strings", () => {
    const form = new FormData();
    form.set("key", "1 OR 1=1");
    expect(parseUuid(form, "key")).toBeNull();
  });
});

describe("parseUuidList", () => {
  it("returns valid UUIDs from a list", () => {
    const form = new FormData();
    form.append("key", "3f2504e0-4f89-41d3-9a0c-0305e82c3301");
    form.append("key", "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    form.append("key", "invalid");
    expect(parseUuidList(form, "key")).toEqual([
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    ]);
  });

  it("returns an empty array when no valid UUIDs", () => {
    const form = new FormData();
    form.append("key", "invalid");
    expect(parseUuidList(form, "key")).toEqual([]);
  });
});

describe("emptyToUndefined", () => {
  it("converts empty strings to undefined", () => {
    expect(emptyToUndefined("")).toBeUndefined();
    expect(emptyToUndefined("   ")).toBeUndefined();
  });

  it("returns non-empty strings as-is", () => {
    expect(emptyToUndefined("hello")).toBe("hello");
  });

  it("returns non-string values as-is", () => {
    expect(emptyToUndefined(null)).toBeNull();
    expect(emptyToUndefined(undefined)).toBeUndefined();
    expect(emptyToUndefined(42)).toBe(42);
  });
});
import { z } from "zod";

export const uuidSchema = z.uuid();

/** Reads a form field and returns it only when it is a valid UUID. */
export function parseUuid(formData: FormData, key: string): string | null {
  const result = uuidSchema.safeParse(formData.get(key));
  return result.success ? result.data : null;
}

/** Collects every UUID submitted under `key` (for checkbox groups). */
export function parseUuidList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => uuidSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []));
}

/** Empty form fields arrive as "" — treat them as "not provided". */
export const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

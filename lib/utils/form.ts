/** Reads an optional trimmed string field; empty becomes `null`. */
export function optionalText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Reads a numeric field; missing, blank, or non-numeric becomes `null`. */
export function optionalNumber(formData: FormData, key: string): number | null {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value !== 0 ? value : null;
}

/** Reads a required string field (already trimmed). */
export function requiredText(formData: FormData, key: string): string {
  return optionalText(formData, key) ?? "";
}

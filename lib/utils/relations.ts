/**
 * PostgREST returns a to-one relation as an object or a single-element
 * array depending on whether an `!inner` hint was used. This normalizes
 * both shapes to the object (or null).
 */
export function unwrapRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (relation == null) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

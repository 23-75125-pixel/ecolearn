/**
 * Returns `target` only when it is a same-site path such as "/student/dashboard".
 * Rejects "//evil.com", "/\evil.com", and full URLs, which would otherwise
 * turn a `?next=` parameter into an open redirect.
 */
export function safeRedirectPath(target: unknown, fallback: string): string {
  if (typeof target !== "string") return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  if (target.includes("\\")) return fallback;
  return target;
}

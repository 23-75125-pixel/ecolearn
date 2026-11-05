import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Turns a database error into text that is safe to show.
 *
 * Our SQL functions explain business-rule failures with `raise exception`
 * (error code P0001), and those messages are written for people ("This slot is
 * no longer available."). Every other error (a missing permission, a dropped
 * connection, a constraint) could expose internals, so it gets the fallback.
 */
export function friendlyDatabaseMessage(
  error: Pick<PostgrestError, "code" | "message">,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error.code === "P0001" && error.message) return error.message;
  if (error.code === "42501") return "You are not allowed to do that.";
  return fallback;
}

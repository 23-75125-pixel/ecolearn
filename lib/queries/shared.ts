import type { DbClient } from "@/lib/supabase/types";

/**
 * Small server-side data-access layer. Pages call these named functions
 * instead of inlining Supabase query builders, so the schema access is in
 * one reviewable place per entity.
 */

export async function getActiveSubjects(client: DbClient) {
  const { data } = await client
    .from("subjects")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getRecentNotifications(client: DbClient, profileId: string, limit = 8) {
  const { data } = await client
    .from("notifications")
    .select("id, title, body, is_read, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

import { timeNowInAppTimeZone, todayInAppTimeZone } from "@/lib/utils/datetime";
import type { DbClient } from "@/lib/supabase/types";

/** Active, approved tutors for the directory. */
export async function getDirectoryTutors(client: DbClient) {
  const { data, error } = await client
    .from("tutor_profiles")
    .select("id, headline, bio, profiles(first_name, last_name, avatar_url), tutor_subjects(subjects(name))")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) console.error("Tutor directory query failed:", error.message);
  return data ?? [];
}

/** One active tutor, or null when the tutor does not exist or is not accepting bookings. */
export async function getPublicTutor(client: DbClient, tutorId: string) {
  const { data } = await client
    .from("tutor_profiles")
    .select("id, headline, bio, profiles(first_name, last_name, avatar_url), tutor_subjects(subjects(name))")
    .eq("id", tutorId)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

/** Open slots that have not started yet (today's earlier slots are left out), soonest first. */
export async function getOpenSlots(client: DbClient, tutorId: string) {
  const today = todayInAppTimeZone();
  const now = timeNowInAppTimeZone();
  const { data } = await client
    .from("appointment_slots")
    .select("id, slot_date, start_time, end_time, session_mode, subjects(name)")
    .eq("tutor_profile_id", tutorId)
    .eq("status", "open")
    .gte("slot_date", today)
    .order("slot_date")
    .order("start_time")
    .limit(60);

  return (data ?? []).filter((slot) => slot.slot_date > today || slot.start_time.slice(0, 5) > now).slice(0, 30);
}

import { ACTIVE_APPOINTMENT_STATUSES, REVIEWABLE_APPLICATION_STATUSES } from "@/lib/constants/status";
import type { MetricSlug } from "@/lib/constants/admin-metrics";
import type { DbClient } from "@/lib/supabase/types";
import { todayInAppTimeZone } from "@/lib/utils/datetime";

export type AdminStat = { slug: MetricSlug; value: number };

const head = { count: "exact", head: true } as const;

/** Head-count queries for the cards on the admin dashboard. A failed count shows as 0. */
export async function loadAdminStats(client: DbClient): Promise<AdminStat[]> {
  const today = todayInAppTimeZone();
  const [students, tutors, pending, approved, rejected, upcoming, windows] = await Promise.all([
    client.from("profiles").select("id", head).eq("role", "student"),
    client.from("profiles").select("id", head).eq("role", "tutor"),
    client.from("tutor_applications").select("id", head).in("status", ["pending", "under_review"]),
    client.from("tutor_profiles").select("id", head).eq("is_active", true),
    client.from("tutor_applications").select("id", head).eq("status", "rejected"),
    client
      .from("appointments")
      .select("id, appointment_slots!inner(slot_date)", head)
      .in("status", ACTIVE_APPOINTMENT_STATUSES)
      .gte("appointment_slots.slot_date", today),
    client.from("availability").select("id", head),
  ]);

  return [
    { slug: "students", value: students.count ?? 0 },
    { slug: "tutor-accounts", value: tutors.count ?? 0 },
    { slug: "pending-applications", value: pending.count ?? 0 },
    { slug: "approved-tutors", value: approved.count ?? 0 },
    { slug: "rejected-applications", value: rejected.count ?? 0 },
    { slug: "upcoming-appointments", value: upcoming.count ?? 0 },
    { slug: "availability", value: windows.count ?? 0 },
  ];
}

/**
 * Applications waiting for an admin decision, oldest first, with the applicant's name.
 * `tutor_applications` points at `profiles` twice (tutor_id, reviewed_by), so the embed names the key.
 */
export async function loadReviewQueue(client: DbClient) {
  const { data, error } = await client
    .from("tutor_applications")
    .select("id, status, submitted_at, profiles!tutor_applications_tutor_id_fkey(first_name, last_name)")
    .in("status", REVIEWABLE_APPLICATION_STATUSES)
    .order("submitted_at", { ascending: true });

  return { queue: data ?? [], failed: Boolean(error) };
}

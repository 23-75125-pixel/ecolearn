import { ACTIVE_APPOINTMENT_STATUSES, APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from "@/lib/constants/status";
import type { MetricSlug } from "@/lib/constants/admin-metrics";
import type { DbClient } from "@/lib/supabase/types";
import { formatSlotDate, formatTimeRange, todayInAppTimeZone } from "@/lib/utils/datetime";
import { unwrapRelation } from "@/lib/utils/relations";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/** One line of an admin metric list, already prepared for display. */
export type MetricRow = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  /** Secondary lines under the name. */
  lines: string[];
  badge?: { label: string; tone: Tone };
  /** A date shown on the right when there is no badge. */
  trailing?: string;
};

export type MetricResult = { rows: MetricRow[]; failed: boolean };

type Person = { first_name: string; last_name: string; avatar_url?: string | null } | null;

const shortDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-PH") : "Date unavailable");

/** email and phone for many profiles in one call (admins only; see get_private_profiles()). */
async function loadContacts(client: DbClient, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, string>();
  const { data } = await client.rpc("get_private_profiles", { p_profile_ids: unique });
  return new Map((data ?? []).map((row) => [row.id, row.phone ? `${row.email} - ${row.phone}` : row.email]));
}

function person(value: Person) {
  return { firstName: value?.first_name ?? "", lastName: value?.last_name ?? "", avatarUrl: value?.avatar_url ?? null };
}

export async function loadMetric(client: DbClient, slug: MetricSlug): Promise<MetricResult> {
  switch (slug) {
    case "students":
    case "tutor-accounts": {
      const { data, error } = await client
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, created_at")
        .eq("role", slug === "students" ? "student" : "tutor")
        .order("created_at", { ascending: false });
      const contacts = await loadContacts(client, (data ?? []).map((row) => row.id));
      return {
        failed: Boolean(error),
        rows: (data ?? []).map((row) => ({
          id: row.id,
          ...person(row),
          lines: [contacts.get(row.id) ?? "Contact details unavailable"],
          trailing: `Joined ${shortDate(row.created_at)}`,
        })),
      };
    }

    case "approved-tutors": {
      const { data, error } = await client
        .from("tutor_profiles")
        .select("id, profile_id, headline, created_at, profiles(first_name, last_name, avatar_url)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const contacts = await loadContacts(client, (data ?? []).map((row) => row.profile_id));
      return {
        failed: Boolean(error),
        rows: (data ?? []).map((row) => ({
          id: row.id,
          ...person(unwrapRelation(row.profiles)),
          lines: [contacts.get(row.profile_id) ?? "Contact details unavailable", ...(row.headline ? [row.headline] : [])],
          trailing: `Approved ${shortDate(row.created_at)}`,
        })),
      };
    }

    case "pending-applications":
    case "rejected-applications": {
      const statuses = slug === "pending-applications" ? (["pending", "under_review"] as const) : (["rejected"] as const);
      const { data, error } = await client
        .from("tutor_applications")
        .select("id, tutor_id, status, submitted_at, reviewed_at, review_notes, profiles!tutor_applications_tutor_id_fkey(first_name, last_name, avatar_url)")
        .in("status", [...statuses])
        .order("submitted_at", { ascending: false });
      const contacts = await loadContacts(client, (data ?? []).map((row) => row.tutor_id));
      return {
        failed: Boolean(error),
        rows: (data ?? []).map((row) => ({
          id: row.id,
          ...person(unwrapRelation(row.profiles)),
          lines: [contacts.get(row.tutor_id) ?? "Contact details unavailable", ...(row.review_notes ? [`Note: ${row.review_notes}`] : [])],
          badge: { label: APPLICATION_STATUS_LABEL[row.status], tone: APPLICATION_STATUS_TONE[row.status] },
          trailing: shortDate(row.submitted_at ?? row.reviewed_at),
        })),
      };
    }

    case "availability": {
      const { data, error } = await client
        .from("availability")
        .select("id, day_date, start_time, end_time, slot_duration_minutes, session_mode, subjects(name), tutor_profiles(profiles(first_name, last_name, avatar_url))")
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true });
      return {
        failed: Boolean(error),
        rows: (data ?? []).map((row) => ({
          id: row.id,
          ...person(unwrapRelation(unwrapRelation(row.tutor_profiles)?.profiles)),
          lines: [
            `${formatSlotDate(row.day_date)}, ${formatTimeRange(row.start_time, row.end_time)} - ${row.slot_duration_minutes}-minute sessions`,
            unwrapRelation(row.subjects)?.name ?? "Any subject",
          ],
          badge: { label: row.session_mode === "online" ? "Online" : "In person", tone: "info" },
        })),
      };
    }

    case "upcoming-appointments": {
      const { data, error } = await client
        .from("appointments")
        .select("id, status, appointment_slots!inner(slot_date, start_time, end_time), tutor_profiles(profiles(first_name, last_name)), profiles!appointments_student_id_fkey(first_name, last_name, avatar_url)")
        .in("status", ACTIVE_APPOINTMENT_STATUSES)
        .gte("appointment_slots.slot_date", todayInAppTimeZone());
      const rows = (data ?? []).flatMap((row) => {
        const slot = unwrapRelation(row.appointment_slots);
        if (!slot) return [];
        const tutor = unwrapRelation(unwrapRelation(row.tutor_profiles)?.profiles);
        const student = unwrapRelation(row.profiles);
        return [
          {
            sortKey: `${slot.slot_date}T${slot.start_time}`,
            row: {
              id: row.id,
              ...person(student),
              lines: [
                `Tutor: ${tutor ? `${tutor.first_name} ${tutor.last_name}` : "Tutor unavailable"}`,
                `${formatSlotDate(slot.slot_date)}, ${formatTimeRange(slot.start_time, slot.end_time)}`,
              ],
              badge: { label: APPOINTMENT_STATUS_LABEL[row.status], tone: APPOINTMENT_STATUS_TONE[row.status] },
            } satisfies MetricRow,
          },
        ];
      });
      return { failed: Boolean(error), rows: rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map((item) => item.row) };
    }
  }
}

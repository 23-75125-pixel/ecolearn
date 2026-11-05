import { toAppointmentView, type AppointmentView } from "@/lib/appointments/view";
import { unwrapRelation } from "@/lib/utils/relations";
import type { DbClient } from "@/lib/supabase/types";

const APPOINTMENT_FIELDS =
  "id, status, notes, session_mode, meeting_url, location, cancellation_reason, appointment_slots(slot_date, start_time, end_time), subjects(name)";

/** A student's appointments, each with the name of the tutor. Returns null when the query fails. */
export async function getStudentAppointments(client: DbClient, studentId: string): Promise<AppointmentView[] | null> {
  const { data, error } = await client
    .from("appointments")
    .select(`${APPOINTMENT_FIELDS}, tutor_profiles(profiles(first_name, last_name))`)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Student appointments query failed:", error.message);
    return null;
  }

  return data.flatMap((row) => {
    const tutor = unwrapRelation(unwrapRelation(row.tutor_profiles)?.profiles);
    const view = toAppointmentView(row, tutor);
    return view ? [view] : [];
  });
}

/**
 * A tutor's appointments, each with the name of the student.
 *
 * `appointments` points at `profiles` twice (student_id and cancelled_by), so
 * the embed must name the foreign key. Without the hint PostgREST answers
 * "more than one relationship was found" and the tutor sees no appointments.
 */
export async function getTutorAppointments(client: DbClient, tutorProfileId: string): Promise<AppointmentView[] | null> {
  const { data, error } = await client
    .from("appointments")
    .select(`${APPOINTMENT_FIELDS}, profiles!appointments_student_id_fkey(first_name, last_name)`)
    .eq("tutor_profile_id", tutorProfileId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Tutor appointments query failed:", error.message);
    return null;
  }

  return data.flatMap((row) => {
    const view = toAppointmentView(row, unwrapRelation(row.profiles));
    return view ? [view] : [];
  });
}

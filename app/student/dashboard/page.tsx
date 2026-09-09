import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from "@/lib/constants/status";

export default async function StudentDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, status, appointment_slots(slot_date, start_time), tutor_profiles(profiles(first_name, last_name)), subjects(name)",
    )
    .eq("student_id", profile!.id)
    .in("status", ["scheduled", "confirmed"])
    .order("slot_date", { foreignTable: "appointment_slots", ascending: true })
    .limit(5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.first_name}</h1>
      <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s coming up.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardDescription>Your next scheduled sessions.</CardDescription>
          </CardHeader>

          {!appointments || appointments.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted">
              No upcoming appointments yet.{" "}
              <Link href="/tutors" className="font-medium text-primary-600 hover:underline">
                Find a tutor
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {appointments.map((appt) => {
                const tutorProfile = Array.isArray(appt.tutor_profiles)
                  ? appt.tutor_profiles[0]
                  : appt.tutor_profiles;
                const tutor = Array.isArray(tutorProfile?.profiles)
                  ? tutorProfile?.profiles[0]
                  : tutorProfile?.profiles;
                const slot = Array.isArray(appt.appointment_slots)
                  ? appt.appointment_slots[0]
                  : appt.appointment_slots;
                const subject = Array.isArray(appt.subjects) ? appt.subjects[0] : appt.subjects;

                return (
                  <li key={appt.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {tutor?.first_name} {tutor?.last_name}
                        {subject?.name ? ` — ${subject.name}` : ""}
                      </p>
                      {slot && (
                        <p className="text-sm text-muted">
                          {slot.slot_date} at {slot.start_time}
                        </p>
                      )}
                    </div>
                    <Badge tone={APPOINTMENT_STATUS_TONE[appt.status]}>
                      {APPOINTMENT_STATUS_LABEL[appt.status]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <Link
            href="/tutors"
            className="block rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-surface"
          >
            Find a tutor
          </Link>
          <p className="mt-3 text-xs text-muted">
            Appointment history and profile management are coming in the next development phase.
          </p>
        </Card>
      </div>
    </div>
  );
}

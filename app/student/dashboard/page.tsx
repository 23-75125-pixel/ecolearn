import Link from "next/link";
import { Search, X } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
} from "@/lib/constants/status";
import { unwrapRelation } from "@/lib/utils/relations";
import { getRecentNotifications } from "@/lib/queries/shared";
import type { DbClient } from "@/lib/supabase/types";
import { shortTime } from "@/lib/utils/datetime";
import { cancelAppointment } from "@/app/student/actions";
import { NotificationList } from "@/components/notifications/notification-list";
import { DIVIDE, EMPTY_STATE, ICON, ITEM_TITLE, SUBTEXT, TEXT_LINK, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

export default async function StudentDashboardPage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const [appointments, notifications] = await Promise.all([
    loadAppointments(supabase, profile.id),
    getRecentNotifications(supabase, profile.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className={TITLE}>{profile.first_name ? `Welcome, ${profile.first_name}` : "Welcome"}</h1>
      <p className={cn(SUBTEXT, "mt-1")}>Here&apos;s what&apos;s coming up.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Your scheduled sessions and appointment history.</CardDescription>
          </CardHeader>

          {appointments.length === 0 ? (
            <div className={EMPTY_STATE}>
              No appointments yet.{" "}
              <Link href="/tutors" className={TEXT_LINK}>
                Find a tutor
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <ul className={DIVIDE}>
              {appointments.map((appt) => (
                <StudentAppointmentRow key={appt.id} appointment={appt} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <Link href="/tutors" className={buttonClasses({ variant: "secondary", className: "w-full" })}>
            <Search className={ICON} />
            Find a tutor
          </Link>
          <p className={cn(SUBTEXT, "mt-4 leading-6")}>Book sessions, review past appointments, and manage cancellations from this dashboard.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Updates about applications and appointments.</CardDescription></CardHeader>
        <NotificationList notifications={notifications} />
      </Card>
    </div>
  );
}

async function loadAppointments(supabase: DbClient, studentId: string) {
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, status, appointment_slots(slot_date, start_time), tutor_profiles(profiles(first_name, last_name)), subjects(name)",
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

type Appointment = Awaited<ReturnType<typeof loadAppointments>>[number];

function StudentAppointmentRow({ appointment: appt }: { appointment: Appointment }) {
  const tutorProfile = unwrapRelation(appt.tutor_profiles);
  const tutor = unwrapRelation(tutorProfile?.profiles);
  const slot = unwrapRelation(appt.appointment_slots);
  const subject = unwrapRelation(appt.subjects);
  const isCancellable = ACTIVE_APPOINTMENT_STATUSES.includes(appt.status);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className={ITEM_TITLE}>
          {tutor?.first_name} {tutor?.last_name}
          {subject?.name ? ` — ${subject.name}` : ""}
        </p>
        {slot && (
          <p className={SUBTEXT}>
            {slot.slot_date} at {shortTime(slot.start_time)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={APPOINTMENT_STATUS_TONE[appt.status]}>
          {APPOINTMENT_STATUS_LABEL[appt.status]}
        </Badge>
        {isCancellable && (
          <form action={cancelAppointment}>
            <input type="hidden" name="appointmentId" value={appt.id} />
            <button type="submit" className={buttonClasses({ variant: "secondary", size: "sm" })}>
              <X className={ICON} />
              Cancel
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cancelAppointment } from "@/app/student/actions";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { NotificationList } from "@/components/notifications/notification-list";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { STUDENT_TUTORS_PATH } from "@/lib/constants/roles";
import { getStudentAppointments } from "@/lib/queries/appointments";
import { getRecentNotifications } from "@/lib/queries/shared";
import { splitAppointments } from "@/lib/appointments/view";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_STATE, ICON_INLINE, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const profile = await requireRole("student");
  const { booked } = await searchParams;
  const supabase = await createClient();

  const [appointments, notifications] = await Promise.all([
    getStudentAppointments(supabase, profile.id),
    getRecentNotifications(supabase, profile.id),
  ]);
  const { upcoming, history } = splitAppointments(appointments ?? []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={TITLE}>{profile.first_name ? `Welcome, ${profile.first_name}` : "Welcome"}</h1>
          <p className={cn(SUBTEXT, "mt-1")}>Here&apos;s what&apos;s coming up.</p>
        </div>
        <Link href={STUDENT_TUTORS_PATH} className={buttonClasses()}>
          Find a tutor
          <ArrowRight aria-hidden="true" className={ICON_INLINE} />
        </Link>
      </div>

      {booked === "1" && (
        <Alert role="status" className="mt-6">
          Session requested. Your tutor will confirm it soon, and the meeting details will appear here.
        </Alert>
      )}
      {appointments === null && (
        <Alert className="mt-6">We couldn&apos;t load your sessions. Please refresh the page.</Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Upcoming sessions</CardTitle>
          <CardDescription>Your booked sessions and how to join them.</CardDescription>
        </CardHeader>
        {upcoming.length === 0 ? (
          <p className={EMPTY_STATE}>No upcoming sessions. Find a tutor to book your first one.</p>
        ) : (
          <AppointmentList appointments={upcoming} actor="student" handlers={{ cancel: cancelAppointment }} />
        )}
      </Card>

      {history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Session history</CardTitle>
            <CardDescription>Completed, cancelled and missed sessions.</CardDescription>
          </CardHeader>
          <AppointmentList appointments={history} actor="student" handlers={{ cancel: cancelAppointment }} />
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Updates about your sessions.</CardDescription>
        </CardHeader>
        <NotificationList notifications={notifications} />
      </Card>
    </div>
  );
}

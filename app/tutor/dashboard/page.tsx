import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getActiveSubjects, getRecentNotifications } from "@/lib/queries/shared";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  APPLICATION_STATUS_MESSAGE,
  EDITABLE_APPLICATION_STATUSES,
} from "@/lib/constants/status";
import { unwrapRelation } from "@/lib/utils/relations";
import { ApplicationForm } from "@/components/tutor/application-form";
import { AvailabilityManager } from "@/components/tutor/availability-manager";
import { NotificationList } from "@/components/notifications/notification-list";
import { ProfileEditor } from "@/components/tutor/profile-editor";
import { DIVIDE, ITEM_TITLE, SUBTEXT, SURFACE, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { shortTime } from "@/lib/utils/datetime";
import {
  getAvailability,
  getTutorApplication,
  getTutorProfile,
  getUpcomingAppointments,
} from "./queries";

type Application = NonNullable<Awaited<ReturnType<typeof getTutorApplication>>>;

function WelcomeHeading({ firstName }: { firstName: string }) {
  return (
    <h1 className={TITLE}>{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {children}
    </div>
  );
}

function ApplicationFormCard({ subjects }: { subjects: ComponentProps<typeof ApplicationForm>["subjects"] }) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Start your tutor application</CardTitle>
        <CardDescription>
          Approval is required before you can set availability or receive bookings.
        </CardDescription>
      </CardHeader>
      <ApplicationForm subjects={subjects} />
    </Card>
  );
}

function ApplicationStatusCard({ application, subjects }: { application: Application; subjects: ComponentProps<typeof ApplicationForm>["subjects"] }) {
  const isEditable = EDITABLE_APPLICATION_STATUSES.includes(application.status);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Application status</CardTitle>
        <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </CardHeader>
      <p className="text-sm">{APPLICATION_STATUS_MESSAGE[application.status]}</p>

      {application.review_notes && (
        <div className={cn("mt-4 rounded-md p-4 text-sm", SURFACE)}>
          <p className={ITEM_TITLE}>Administrator feedback</p>
          <p className={cn(SUBTEXT, "mt-1")}>{application.review_notes}</p>
        </div>
      )}

      {isEditable && <ApplicationForm application={application} subjects={subjects} />}
    </Card>
  );
}

function AppointmentsCard({ appointments }: { appointments: Awaited<ReturnType<typeof getUpcomingAppointments>> }) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle>Upcoming appointments</CardTitle>
      </CardHeader>
      <p className={TITLE}>{appointments.length}</p>
      <ul className={cn("mt-4", DIVIDE)}>
        {appointments.map((appointment) => {
          const student = unwrapRelation(appointment.profiles);
          const slot = unwrapRelation(appointment.appointment_slots);
          return (
            <li key={appointment.id} className="py-3 text-sm">
              <p className={ITEM_TITLE}>
                {student?.first_name} {student?.last_name}
              </p>
              <p className={SUBTEXT}>
                {slot?.slot_date} · {slot ? shortTime(slot.start_time) : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default async function TutorDashboardPage() {
  const profile = await requireRole("tutor");
  const supabase = await createClient();

  const application = await getTutorApplication(supabase, profile.id);

  if (!application) {
    const subjects = await getActiveSubjects(supabase);
    return (
      <PageShell>
        <WelcomeHeading firstName={profile.first_name} />
        <ApplicationFormCard subjects={subjects} />
      </PageShell>
    );
  }

  if (application.status !== "approved") {
    const subjects = await getActiveSubjects(supabase);
    return (
      <PageShell>
        <WelcomeHeading firstName={profile.first_name} />
        <ApplicationStatusCard application={application} subjects={subjects} />
      </PageShell>
    );
  }

  const tutorProfile = await getTutorProfile(supabase, profile.id);

  if (!tutorProfile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Alert role="status">
          Your approved tutor profile is still being prepared. Please try again shortly.
        </Alert>
      </div>
    );
  }

  const [appointments, subjects, availability, notifications] = await Promise.all([
    getUpcomingAppointments(supabase, tutorProfile.id),
    getActiveSubjects(supabase),
    getAvailability(supabase, tutorProfile.id),
    getRecentNotifications(supabase, profile.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <WelcomeHeading firstName={profile.first_name} />
        <Badge tone="success">Approved tutor</Badge>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <AppointmentsCard appointments={appointments} />
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Manage your bookable schedule.</CardDescription>
          </CardHeader>
          <AvailabilityManager availability={availability} subjects={subjects} />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>Keep the profile students see up to date.</CardDescription>
        </CardHeader>
        <ProfileEditor headline={tutorProfile.headline} bio={tutorProfile.bio} />
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Updates about your application and sessions.</CardDescription>
        </CardHeader>
        <NotificationList notifications={notifications} />
      </Card>
    </div>
  );
}

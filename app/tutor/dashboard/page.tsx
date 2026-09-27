import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  APPLICATION_STATUS_MESSAGE,
  EDITABLE_APPLICATION_STATUSES,
} from "@/lib/constants/status";
import { unwrapRelation } from "@/lib/utils/relations";
import { ApplicationForm } from "@/components/tutor/application-form";
import { AvailabilityManager } from "@/components/tutor/availability-manager";
import { NotificationList } from "@/components/student/notification-list";
import { ProfileEditor } from "@/components/tutor/profile-editor";
import {
  getActiveSubjects,
  getAvailability,
  getRecentNotifications,
  getTutorApplication,
  getTutorProfile,
  getUpcomingAppointments,
} from "./queries";

type Application = NonNullable<Awaited<ReturnType<typeof getTutorApplication>>>;

function WelcomeHeading({ firstName }: { firstName?: string | null }) {
  return (
    <h1 className="text-2xl font-bold text-foreground">Welcome, {firstName}</h1>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Application status</CardTitle>
        <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </CardHeader>
      <p className="text-sm text-foreground">{APPLICATION_STATUS_MESSAGE[application.status]}</p>

      {application.review_notes && (
        <div className="mt-4 rounded-md bg-surface p-4 text-sm text-foreground">
          <p className="font-medium">Administrator feedback</p>
          <p className="mt-1 text-muted">{application.review_notes}</p>
        </div>
      )}

      {isEditable && <ApplicationForm application={application} subjects={subjects} />}
    </Card>
  );
}

function AppointmentsCard({ appointments }: { appointments: Awaited<ReturnType<typeof getUpcomingAppointments>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming appointments</CardTitle>
      </CardHeader>
      <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
      <ul className="mt-4 divide-y divide-border">
        {appointments.map((appointment) => {
          const student = unwrapRelation(appointment.profiles);
          const slot = unwrapRelation(appointment.appointment_slots);
          return (
            <li key={appointment.id} className="py-2 text-sm">
              <p className="font-medium text-foreground">
                {student?.first_name} {student?.last_name}
              </p>
              <p className="text-muted">
                {slot?.slot_date} · {slot?.start_time?.slice(0, 5)}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default async function TutorDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const application = await getTutorApplication(supabase, profile!.id);

  if (!application) {
    const subjects = await getActiveSubjects(supabase);
    return (
      <PageShell>
        <WelcomeHeading firstName={profile?.first_name} />
        <ApplicationFormCard subjects={subjects} />
      </PageShell>
    );
  }

  if (application.status !== "approved") {
    const subjects = await getActiveSubjects(supabase);
    return (
      <PageShell>
        <WelcomeHeading firstName={profile?.first_name} />
        <ApplicationStatusCard application={application} subjects={subjects} />
      </PageShell>
    );
  }

  const tutorProfile = await getTutorProfile(supabase, profile!.id);

  if (!tutorProfile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-danger">
        Your approved tutor profile is still being prepared. Please try again shortly.
      </div>
    );
  }

  const [appointments, subjects, availability, notifications] = await Promise.all([
    getUpcomingAppointments(supabase, tutorProfile.id),
    getActiveSubjects(supabase),
    getAvailability(supabase, tutorProfile.id),
    getRecentNotifications(supabase, profile!.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <WelcomeHeading firstName={profile?.first_name} />
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

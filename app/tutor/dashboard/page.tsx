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
import { ApplicationForm } from "@/components/tutor/application-form";
import { AvailabilityManager } from "@/components/tutor/availability-manager";
import { NotificationList } from "@/components/notifications/notification-list";
import { ProfileEditor } from "@/components/tutor/profile-editor";
import { EMPTY_STATE, ITEM_TITLE, SUBTEXT, SURFACE, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { AppointmentList } from "@/components/appointments/appointment-list";
import {
  cancelAppointmentAsTutor,
  completeAppointment,
  confirmAppointment,
  markNoShow,
} from "@/app/tutor/actions";
import { getTutorAppointments } from "@/lib/queries/appointments";
import { splitAppointments, type AppointmentView } from "@/lib/appointments/view";
import { getAvailability, getTutorApplication, getTutorProfile } from "./queries";

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

function AppointmentsCard({ appointments }: { appointments: AppointmentView[] | null }) {
  const { upcoming, history } = splitAppointments(appointments ?? []);
  const handlers = {
    cancel: cancelAppointmentAsTutor,
    confirm: confirmAppointment,
    complete: completeAppointment,
    noShow: markNoShow,
  };

  return (
    <>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Confirm new requests, then teach on the meeting link or at the place you set.
          </CardDescription>
        </CardHeader>
        {appointments === null && <Alert>We couldn&apos;t load your sessions. Please refresh the page.</Alert>}
        {upcoming.length === 0 ? (
          <p className={EMPTY_STATE}>No upcoming sessions yet.</p>
        ) : (
          <AppointmentList appointments={upcoming} actor="tutor" handlers={handlers} />
        )}
      </Card>
      {history.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Session history</CardTitle>
            <CardDescription>Completed, cancelled and missed sessions.</CardDescription>
          </CardHeader>
          <AppointmentList appointments={history} actor="tutor" handlers={handlers} />
        </Card>
      )}
    </>
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
    getTutorAppointments(supabase, tutorProfile.id),
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

      <div className="mt-8 grid min-w-0 gap-6">
        <AppointmentsCard appointments={appointments} />
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Choose when you teach and how: online on a meeting link, or in person.</CardDescription>
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

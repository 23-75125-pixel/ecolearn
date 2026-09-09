import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  APPLICATION_STATUS_MESSAGE,
} from "@/lib/constants/status";
import { ApplicationForm } from "@/components/tutor/application-form";
import { AvailabilityManager } from "@/components/tutor/availability-manager";
import { NotificationList } from "@/components/student/notification-list";

export default async function TutorDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("tutor_applications")
    .select("id, status, review_notes, school_name, degree, major, graduation_year, academic_achievements, teaching_experience_summary, years_experience, teaching_approach, preferred_modes, tutor_application_subjects(subject_id)")
    .eq("tutor_id", profile!.id)
    .maybeSingle();

  if (!application) {
    const { data: subjects } = await supabase.from("subjects").select("id, name").eq("is_active", true).order("name");
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.first_name}</h1>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Start your tutor application</CardTitle>
            <CardDescription>
              Approval is required before you can set availability or receive bookings.
            </CardDescription>
          </CardHeader>
          <ApplicationForm subjects={subjects ?? []} />
        </Card>
      </div>
    );
  }

  if (application.status !== "approved") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.first_name}</h1>
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
          {(application.status === "draft" || application.status === "needs_revision") && (
            <ApplicationForm application={application} subjects={(await supabase.from("subjects").select("id, name").eq("is_active", true).order("name")).data ?? []} />
          )}
        </Card>
      </div>
    );
  }

  const { data: tutorProfile } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("profile_id", profile!.id)
    .single();

  const { count: upcomingCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("tutor_profile_id", tutorProfile!.id)
    .in("status", ["scheduled", "confirmed"]);

  const [{ data: subjects }, { data: availability }] = await Promise.all([
    supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("availability")
      .select("id, day_date, start_time, end_time, slot_duration_minutes, subject_id")
      .eq("tutor_profile_id", tutorProfile!.id)
      .order("day_date")
      .order("start_time"),
  ]);
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, created_at")
    .eq("profile_id", profile!.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.first_name}</h1>
        <Badge tone="success">Approved tutor</Badge>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-foreground">{upcomingCount ?? 0}</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Manage your bookable schedule.</CardDescription>
          </CardHeader>
          <AvailabilityManager availability={availability ?? []} subjects={subjects ?? []} />
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Updates about your application and sessions.</CardDescription></CardHeader>
        <NotificationList notifications={notifications ?? []} />
      </Card>
    </div>
  );
}

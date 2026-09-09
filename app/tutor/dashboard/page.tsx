import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  APPLICATION_STATUS_MESSAGE,
} from "@/lib/constants/status";

export default async function TutorDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("tutor_applications")
    .select("id, status, review_notes")
    .eq("tutor_id", profile!.id)
    .maybeSingle();

  if (!application) {
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
          <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted">
            The guided application form is arriving in the next development phase.
          </div>
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
          <div className="mt-6 rounded-md border border-dashed border-border p-4 text-sm text-muted">
            Availability and appointments unlock once your application is approved.
          </div>
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
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
            Availability management is arriving in the next development phase.
          </div>
        </Card>
      </div>
    </div>
  );
}

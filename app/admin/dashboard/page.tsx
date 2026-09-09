import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_TONE, APPLICATION_STATUS_LABEL } from "@/lib/constants/status";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalStudents },
    { count: totalTutorAccounts },
    { count: pendingApplications },
    { count: approvedTutors },
    { count: rejectedApplications },
    { count: upcomingAppointments },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "tutor"),
    supabase
      .from("tutor_applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "under_review"]),
    supabase.from("tutor_profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("tutor_applications").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["scheduled", "confirmed"]),
  ]);

  const { data: applications, error: queueError } = await supabase
    .from("tutor_applications")
    .select("id, tutor_id, status, submitted_at")
    .in("status", ["pending", "under_review", "needs_revision"])
    .order("submitted_at", { ascending: true });

  const tutorIds = (applications ?? []).map((application) => application.tutor_id);
  const { data: applicants } = tutorIds.length > 0
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", tutorIds)
    : { data: [] };
  const applicantById = new Map((applicants ?? []).map((applicant) => [applicant.id, applicant]));
  const queue = (applications ?? []).map((application) => ({
    ...application,
    profiles: applicantById.get(application.tutor_id) ?? null,
  }));

  const stats = [
    { label: "Students", value: totalStudents },
    { label: "Tutor accounts", value: totalTutorAccounts },
    { label: "Pending applications", value: pendingApplications },
    { label: "Approved tutors", value: approvedTutors },
    { label: "Rejected applications", value: rejectedApplications },
    { label: "Upcoming appointments", value: upcomingAppointments },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Applications awaiting review</CardTitle>
        </CardHeader>

        {queueError ? (
          <div className="rounded-md border border-danger/30 bg-danger/10 p-8 text-center text-sm text-danger">
            Unable to load applications for review. Please refresh or check the Supabase migration and RLS policies.
          </div>
        ) : queue.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted">
            Nothing needs your attention right now.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {queue.map((app) => {
              const applicant = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
              return (
                <li key={app.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {applicant?.first_name} {applicant?.last_name}
                    </p>
                    {app.submitted_at && (
                      <p className="text-xs text-muted">
                        Submitted {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={APPLICATION_STATUS_TONE[app.status]}>
                      {APPLICATION_STATUS_LABEL[app.status]}
                    </Badge>
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="text-sm font-medium text-primary-600 hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

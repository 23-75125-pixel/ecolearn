import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/supabase/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  REVIEWABLE_APPLICATION_STATUSES,
} from "@/lib/constants/status";
import { unwrapRelation } from "@/lib/utils/relations";
import {
  DIVIDE,
  EMPTY_STATE,
  ICON,
  ICON_INLINE,
  INTERACTIVE,
  ITEM_TITLE,
  SUBTEXT,
  TITLE,
} from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [stats, { queue, error: queueError }] = await Promise.all([
    loadAdminStats(supabase),
    loadReviewQueue(supabase),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className={TITLE}>Admin dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={`/admin/metrics/${stat.slug}`}
            aria-label={`View ${stat.label.toLowerCase()} data`}
            className={cn("rounded-md", INTERACTIVE)}
          >
            <Card className="h-full p-4 transition-transform duration-150 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className={TITLE}>{stat.value ?? 0}</p>
                <ArrowUpRight aria-hidden="true" className={ICON_INLINE} />
              </div>
              <p className={cn(SUBTEXT, "mt-1")}>{stat.label}</p>
              <p className={cn(SUBTEXT, "mt-3 text-xs")}>View details</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Applications awaiting review</CardTitle>
        </CardHeader>

        {queueError ? (
          <Alert>
            Unable to load applications for review. Please refresh or check the Supabase migration and RLS policies.
          </Alert>
        ) : queue.length === 0 ? (
          <div className={EMPTY_STATE}>
            Nothing needs your attention right now.
          </div>
        ) : (
          <ul className={DIVIDE}>
            {queue.map((app) => {
              const applicant = unwrapRelation(app.profiles);
              return (
                <li key={app.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className={ITEM_TITLE}>
                      {applicant?.first_name} {applicant?.last_name}
                    </p>
                    {app.submitted_at && (
                      <p className={SUBTEXT}>
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
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      Review
                      <ArrowUpRight className={ICON} />
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

type Stat = {
  label: string;
  slug: MetricSlug;
  value: number | null;
};

export const METRIC_LABELS = {
  students: "Students",
  "tutor-accounts": "Tutor accounts",
  "pending-applications": "Pending applications",
  "approved-tutors": "Approved tutors",
  "rejected-applications": "Rejected applications",
  "upcoming-appointments": "Upcoming appointments",
  availability: "Availability windows",
} as const;

export type MetricSlug = keyof typeof METRIC_LABELS;

/** Head-count queries for the six dashboard metric cards. */
async function loadAdminStats(supabase: DbClient): Promise<Stat[]> {
  const [
    { count: totalStudents },
    { count: totalTutorAccounts },
    { count: pendingApplications },
    { count: approvedTutors },
    { count: rejectedApplications },
    { count: upcomingAppointments },
    { count: availabilityWindows },
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
      .in("status", ACTIVE_APPOINTMENT_STATUSES),
    supabase.from("availability").select("id", { count: "exact", head: true }),
  ]);

  return [
    { label: "Students", slug: "students", value: totalStudents },
    { label: "Tutor accounts", slug: "tutor-accounts", value: totalTutorAccounts },
    { label: "Pending applications", slug: "pending-applications", value: pendingApplications },
    { label: "Approved tutors", slug: "approved-tutors", value: approvedTutors },
    { label: "Rejected applications", slug: "rejected-applications", value: rejectedApplications },
    { label: "Upcoming appointments", slug: "upcoming-appointments", value: upcomingAppointments },
    { label: "Availability windows", slug: "availability", value: availabilityWindows },
  ];
}

/** Applications needing a decision, joined with the applicant's name. */
async function loadReviewQueue(supabase: DbClient) {
  const { data: applications, error } = await supabase
    .from("tutor_applications")
    .select("id, tutor_id, status, submitted_at")
    .in("status", REVIEWABLE_APPLICATION_STATUSES)
    .order("submitted_at", { ascending: true });

  if (error || !applications) {
    return { queue: [], error: error ?? new Error("No application rows returned.") };
  }

  const tutorIds = applications.map((application) => application.tutor_id);
  const { data: applicants } =
    tutorIds.length > 0
      ? await supabase.from("profiles").select("id, first_name, last_name").in("id", tutorIds)
      : { data: [] };

  const applicantById = new Map((applicants ?? []).map((applicant) => [applicant.id, applicant]));
  const queue = applications.map((application) => ({
    ...application,
    profiles: applicantById.get(application.tutor_id) ?? null,
  }));

  return { queue, error: null };
}

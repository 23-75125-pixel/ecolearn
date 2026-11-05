import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { METRIC_LABELS } from "@/lib/constants/admin-metrics";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "@/lib/constants/status";
import { loadAdminStats, loadReviewQueue } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { DIVIDE, EMPTY_STATE, ICON, ICON_INLINE, INTERACTIVE, ITEM_TITLE, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { unwrapRelation } from "@/lib/utils/relations";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [stats, { queue, failed }] = await Promise.all([loadAdminStats(supabase), loadReviewQueue(supabase)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className={TITLE}>Admin dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.slug}
            href={`/admin/metrics/${stat.slug}`}
            aria-label={`View ${METRIC_LABELS[stat.slug].toLowerCase()} data`}
            className={cn("rounded-md", INTERACTIVE)}
          >
            <Card className="h-full p-4 transition-transform duration-150 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className={TITLE}>{stat.value}</p>
                <ArrowUpRight aria-hidden="true" className={ICON_INLINE} />
              </div>
              <p className={cn(SUBTEXT, "mt-1")}>{METRIC_LABELS[stat.slug]}</p>
              <p className={cn(SUBTEXT, "mt-3 text-xs")}>View details</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Applications awaiting review</CardTitle>
        </CardHeader>

        {failed ? (
          <Alert>We couldn&apos;t load the applications. Please refresh the page.</Alert>
        ) : queue.length === 0 ? (
          <div className={EMPTY_STATE}>
            Nothing needs your attention right now.
          </div>
        ) : (
          <ul className={DIVIDE} aria-label="Applications awaiting review">
            {queue.map((app) => {
              const applicant = unwrapRelation(app.profiles);
              return (
                <li key={app.id} data-testid="review-item" className="flex items-center justify-between gap-3 py-3">
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

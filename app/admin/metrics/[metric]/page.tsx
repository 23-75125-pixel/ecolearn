import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { isMetricSlug, METRIC_LABELS } from "@/lib/constants/admin-metrics";
import { loadMetric } from "@/lib/queries/admin-metrics";
import { createClient } from "@/lib/supabase/server";
import { DIVIDE, ICON_INLINE, ITEM_TITLE, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const ROW_GRID = "grid gap-4 sm:grid-cols-[minmax(14rem,2fr)_minmax(7rem,0.7fr)] sm:items-center";

export default async function AdminMetricPage({ params }: { params: Promise<{ metric: string }> }) {
  const { metric } = await params;
  if (!isMetricSlug(metric)) notFound();

  const supabase = await createClient();
  const { rows, failed } = await loadMetric(supabase, metric);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/admin/dashboard" className={buttonClasses({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden="true" className={ICON_INLINE} />
        Dashboard
      </Link>

      <h1 className={cn(TITLE, "mt-6")}>{METRIC_LABELS[metric]}</h1>
      <p className={cn(SUBTEXT, "mt-1")}>
        {rows.length} {rows.length === 1 ? "record" : "records"} found
      </p>

      {failed ? (
        <Alert className="mt-8">We couldn&apos;t load this data. Please refresh the page.</Alert>
      ) : rows.length === 0 ? (
        <Card className="mt-8">
          <p className={SUBTEXT}>There is no data to display for this metric yet.</p>
        </Card>
      ) : (
        <Card className="mt-8 overflow-x-auto p-0">
          <ul aria-label={`${METRIC_LABELS[metric]} data`} className={cn("min-w-[30rem]", DIVIDE)}>
            {rows.map((row) => (
              <li key={row.id} data-testid="metric-row" className={cn(ROW_GRID, "p-5")}>
                <div className="flex min-w-0 items-start gap-3">
                  <ProfileAvatar firstName={row.firstName} lastName={row.lastName} avatarUrl={row.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className={ITEM_TITLE}>
                      {row.firstName} {row.lastName}
                    </p>
                    {row.lines.map((line) => (
                      <p key={line} className={cn(SUBTEXT, "break-words")}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="sm:text-right">
                  {row.badge && <Badge tone={row.badge.tone}>{row.badge.label}</Badge>}
                  {row.trailing && <p className={cn(SUBTEXT, row.badge && "mt-1")}>{row.trailing}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

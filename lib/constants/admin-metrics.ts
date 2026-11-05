/** The cards on the admin dashboard, each linking to /admin/metrics/<slug>. */
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

export const METRIC_SLUGS = Object.keys(METRIC_LABELS) as MetricSlug[];

export function isMetricSlug(value: string): value is MetricSlug {
  return value in METRIC_LABELS;
}

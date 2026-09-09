import type { ApplicationStatus, AppointmentStatus } from "@/types/database.types";

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  under_review: "Under review",
  needs_revision: "Needs revision",
  approved: "Approved",
  rejected: "Not approved",
};

export const APPLICATION_STATUS_TONE: Record<
  ApplicationStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  draft: "neutral",
  pending: "info",
  under_review: "info",
  needs_revision: "warning",
  approved: "success",
  rejected: "danger",
};

export const APPLICATION_STATUS_MESSAGE: Record<ApplicationStatus, string> = {
  draft: "Continue filling out your application whenever you're ready.",
  pending: "Your application is currently being reviewed.",
  under_review: "An administrator is currently reviewing your application.",
  needs_revision:
    "Additional information is required before your application can be approved.",
  approved: "Congratulations! Your tutor application has been approved.",
  rejected: "Your tutor application was not approved.",
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const APPOINTMENT_STATUS_TONE: Record<
  AppointmentStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  scheduled: "info",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "warning",
};

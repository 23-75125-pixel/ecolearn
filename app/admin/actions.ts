"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleClient } from "@/lib/auth/session";

export type ReviewFormState = { error?: string } | null;

/**
 * Every one of these re-checks the caller is an admin via requireRole()
 * before touching the database — proxy.ts and the /admin layout already
 * guard the page these are called from, but a Server Action can in
 * principle be invoked directly, so it re-asserts the same rule. The
 * actual enforcement backstop either way is the tutor_applications RLS
 * policy plus the enforce_application_status_transition trigger, which
 * would reject the update regardless of what this function does.
 */

type ApplicationReview = {
  status: "approved" | "rejected" | "needs_revision";
  /** Shown when a required reason is missing. */
  requiredReasonMessage: string;
  /** Shown when the database update fails. */
  failureMessage: string;
};

async function reviewApplication(
  formData: FormData,
  review: ApplicationReview,
): Promise<ReviewFormState> {
  const { supabase } = await requireRoleClient("admin");

  const applicationId = String(formData.get("applicationId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (review.status !== "approved" && !reason) {
    return { error: review.requiredReasonMessage };
  }

  const { error } = await supabase
    .from("tutor_applications")
    .update({
      status: review.status,
      ...(review.status !== "approved" && { review_notes: reason }),
    })
    .eq("id", applicationId);

  if (error) {
    return { error: review.failureMessage };
  }

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function approveApplication(formData: FormData) {
  await reviewApplication(formData, {
    status: "approved",
    requiredReasonMessage: "",
    failureMessage: "",
  });
}

export async function rejectApplication(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  return reviewApplication(formData, {
    status: "rejected",
    requiredReasonMessage: "A reason is required when rejecting an application.",
    failureMessage: "Unable to reject this application. Please try again.",
  });
}

export async function requestRevision(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  return reviewApplication(formData, {
    status: "needs_revision",
    requiredReasonMessage: "Explain what needs to be corrected before requesting revision.",
    failureMessage: "Unable to update this application. Please try again.",
  });
}


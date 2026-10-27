"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleClient } from "@/lib/auth/session";
import { parseUuid } from "@/lib/validations/common";
import { reviewReasonSchema } from "@/lib/validations/tutor";

export type ReviewFormState = { error?: string } | null;

/**
 * Every action here re-checks that the caller is an admin before touching
 * the database. The real enforcement is still the `tutor_applications` RLS
 * policy plus the `enforce_application_status_transition` trigger.
 */

type ReviewStatus = "approved" | "rejected" | "needs_revision";

type ReviewOptions = {
  status: ReviewStatus;
  /** Shown when a required reason is missing. Omit when no reason is needed. */
  requiredReasonMessage?: string;
  /** Shown when the database update fails. */
  failureMessage: string;
};

async function reviewApplication(
  formData: FormData,
  { status, requiredReasonMessage, failureMessage }: ReviewOptions,
): Promise<ReviewFormState> {
  const { supabase } = await requireRoleClient("admin");

  const applicationId = parseUuid(formData, "applicationId");
  if (!applicationId) return { error: "This application could not be found." };

  const reason = reviewReasonSchema.safeParse(formData.get("reason") ?? "");
  if (!reason.success) return { error: reason.error.issues[0].message };
  if (requiredReasonMessage && !reason.data) return { error: requiredReasonMessage };

  const { error } = await supabase
    .from("tutor_applications")
    .update({
      status,
      ...(status !== "approved" && { review_notes: reason.data }),
    })
    .eq("id", applicationId);
  if (error) return { error: failureMessage };

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function approveApplication(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  return reviewApplication(formData, {
    status: "approved",
    failureMessage: "Unable to approve this application. Please try again.",
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

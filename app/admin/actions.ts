"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

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

export async function approveApplication(formData: FormData) {
  await requireRole("admin");
  const applicationId = String(formData.get("applicationId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (error) {
    return;
  }
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function rejectApplication(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  await requireRole("admin");
  const applicationId = String(formData.get("applicationId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    return { error: "A reason is required when rejecting an application." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_applications")
    .update({ status: "rejected", review_notes: reason })
    .eq("id", applicationId);

  if (error) {
    return { error: "Unable to reject this application. Please try again." };
  }
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function requestRevision(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  await requireRole("admin");
  const applicationId = String(formData.get("applicationId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    return { error: "Explain what needs to be corrected before requesting revision." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_applications")
    .update({ status: "needs_revision", review_notes: reason })
    .eq("id", applicationId);

  if (error) {
    return { error: "Unable to update this application. Please try again." };
  }
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

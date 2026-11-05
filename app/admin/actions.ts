"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleClient } from "@/lib/auth/session";
import { parseUuid } from "@/lib/validations/common";
import { reviewReasonSchema } from "@/lib/validations/tutor";
import { z } from "zod";

export type ReviewFormState = { error?: string } | null;
export type SubjectFormState = { error?: string; success?: string } | null;

const subjectNameSchema = z.string().trim().min(2, "Subject name must be at least 2 characters.").max(80, "Subject name must be at most 80 characters.");

function makeSubjectSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createSubject(
  _previous: SubjectFormState,
  formData: FormData,
): Promise<SubjectFormState> {
  const { supabase } = await requireRoleClient("admin");
  const parsed = subjectNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const name = parsed.data;
  const slug = makeSubjectSlug(name);
  if (!slug) return { error: "Subject name must contain letters or numbers." };

  const { error } = await supabase.from("subjects").insert({ name, slug, is_active: true });
  if (error) {
    if (error.code === "23505") return { error: "A subject with this name already exists." };
    return { error: "Unable to add this subject. Please try again." };
  }
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  return { success: "Subject added." };
}

export async function setSubjectActive(
  _previous: SubjectFormState,
  formData: FormData,
): Promise<SubjectFormState> {
  const { supabase } = await requireRoleClient("admin");
  const subjectId = parseUuid(formData, "subjectId");
  if (!subjectId) return { error: "This subject could not be found." };
  const isActive = formData.get("isActive") === "true";
  const { error } = await supabase.from("subjects").update({ is_active: isActive }).eq("id", subjectId);
  if (error) return { error: "Unable to update this subject. Please try again." };
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  revalidatePath("/tutor/dashboard");
  return { success: isActive ? "Subject activated." : "Subject hidden." };
}

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

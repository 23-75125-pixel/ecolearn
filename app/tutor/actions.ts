"use server";

import { revalidatePath } from "next/cache";
import { requireRoleClient } from "@/lib/auth/session";
import type { CurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { optionalNumber, optionalText } from "@/lib/utils/form";

export type TutorFormState = { error?: string; success?: string } | null;

type Supabase = Awaited<ReturnType<typeof createClient>>;

const MAX_CREDENTIAL_FILE_BYTES = 20 * 1024 * 1024;

type ApplicationPayload = {
  school_name: string | null;
  degree: string | null;
  major: string | null;
  graduation_year: number | null;
  academic_achievements: string | null;
  teaching_experience_summary: string | null;
  years_experience: number | null;
  teaching_approach: string | null;
  preferred_modes: ("online" | "in_person" | "hybrid")[];
};

/** Maps raw form fields to the `tutor_applications` row shape. */
function parseApplicationPayload(formData: FormData): ApplicationPayload {
  return {
    school_name: optionalText(formData, "schoolName"),
    degree: optionalText(formData, "degree"),
    major: optionalText(formData, "major"),
    graduation_year: optionalNumber(formData, "graduationYear"),
    academic_achievements: optionalText(formData, "academicAchievements"),
    teaching_experience_summary: optionalText(formData, "experience"),
    years_experience: optionalNumber(formData, "yearsExperience"),
    teaching_approach: optionalText(formData, "teachingApproach"),
    preferred_modes: formData
      .getAll("preferredModes")
      .map(String)
      .filter(Boolean) as ApplicationPayload["preferred_modes"],
  };
}

/** Returns an error message for the first failed rule, or null when valid. */
function validateApplication(
  payload: ApplicationPayload,
  subjectIds: string[],
): string | null {
  const missingAcademicFields = [
    !payload.school_name && "school",
    !payload.degree && "degree",
    !payload.major && "major",
  ].filter(Boolean);
  if (missingAcademicFields.length > 0) {
    return `Please complete: ${missingAcademicFields.join(", ")}.`;
  }
  if (subjectIds.length === 0) {
    return "Choose at least one subject you want to teach.";
  }
  if (!payload.teaching_experience_summary || !payload.teaching_approach) {
    return "Add your teaching experience and approach.";
  }
  if (payload.preferred_modes.length === 0) {
    return "Choose at least one teaching mode.";
  }
  return null;
}

async function getTutorProfileId(
  supabase: Supabase,
  profileId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  return data?.id ?? null;
}

/** Updates the existing application, or creates it as a draft. */
async function upsertApplication(
  supabase: Supabase,
  tutorId: string,
  existingApplicationId: string,
  payload: ApplicationPayload,
): Promise<{ id: string } | { error: string }> {
  if (existingApplicationId) {
    const { error } = await supabase
      .from("tutor_applications")
      .update(payload)
      .eq("id", existingApplicationId)
      .eq("tutor_id", tutorId);
    if (error) {
      return { error: "Unable to save your application. Please check the details and try again." };
    }
    return { id: existingApplicationId };
  }

  const { data, error } = await supabase
    .from("tutor_applications")
    .insert({ ...payload, tutor_id: tutorId, status: "draft" })
    .select("id")
    .single();
  if (error || !data) {
    return { error: "Unable to submit your application. Please try again." };
  }
  return { id: data.id };
}

/** Replaces the subject selection for an application. Returns an error or null. */
async function replaceApplicationSubjects(
  supabase: Supabase,
  applicationId: string,
  subjectIds: string[],
): Promise<string | null> {
  await supabase
    .from("tutor_application_subjects")
    .delete()
    .eq("application_id", applicationId);

  const { error } = await supabase.from("tutor_application_subjects").insert(
    subjectIds.map((subject_id) => ({ application_id: applicationId, subject_id })),
  );
  return error ? "Application saved, but subjects could not be saved." : null;
}

/** Uploads a credential file and records its metadata. Returns an error or null. */
async function saveCredential(
  supabase: Supabase,
  applicationId: string,
  formData: FormData,
  profile: CurrentProfile,
): Promise<string | null> {
  const file = formData.get("credential") as File | null;
  if (!file || file.size === 0) return null;

  if (file.size > MAX_CREDENTIAL_FILE_BYTES) {
    return "Credential files must be 20 MB or smaller.";
  }

  const storagePath = `${profile.id}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("tutor-credentials")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) return "Application saved, but the credential upload failed.";

  const { error: credentialError } = await supabase.from("tutor_credentials").insert({
    application_id: applicationId,
    credential_type: String(formData.get("credentialType") ?? "other") as
      | "valid_id"
      | "diploma"
      | "certificate"
      | "teaching_credential"
      | "other",
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
  });
  return credentialError ? "Application saved, but the credential record failed." : null;
}

/** Marks a saved application as pending admin review. Returns an error or null. */
async function submitForReview(
  supabase: Supabase,
  applicationId: string,
  tutorId: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("tutor_applications")
    .update({ status: "pending" })
    .eq("id", applicationId)
    .eq("tutor_id", tutorId);
  return error ? "Your application was saved, but could not be submitted for review." : null;
}

export async function saveTutorApplication(
  _previous: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const { profile, supabase } = await requireRoleClient("tutor");

  const subjectIds = formData.getAll("subjectIds").map(String).filter(Boolean);
  const payload = parseApplicationPayload(formData);

  const validationError = validateApplication(payload, subjectIds);
  if (validationError) return { error: validationError };

  const applicationId = String(formData.get("applicationId") ?? "");
  const result = await upsertApplication(supabase, profile.id, applicationId, payload);
  if ("error" in result) return { error: result.error };

  const subjectsError = await replaceApplicationSubjects(supabase, result.id, subjectIds);
  if (subjectsError) return { error: subjectsError };

  const credentialError = await saveCredential(supabase, result.id, formData, profile);
  if (credentialError) return { error: credentialError };

  const submitError = await submitForReview(supabase, result.id, profile.id);
  if (submitError) return { error: submitError };

  revalidatePath("/tutor/dashboard");
  return { success: "Your application was submitted for admin review." };
}

export async function createAvailability(
  _previous: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const { profile, supabase } = await requireRoleClient("tutor");

  const tutorProfileId = await getTutorProfileId(supabase, profile.id);
  if (!tutorProfileId) return { error: "Your tutor profile is not ready yet." };

  const dayDate = String(formData.get("dayDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const duration = optionalNumber(formData, "duration");

  if (!dayDate || !startTime || !endTime || !duration) {
    return { error: "Complete the availability fields." };
  }
  if (new Date(`${dayDate}T${startTime}`) <= new Date()) {
    return { error: "Choose a future date and time." };
  }

  const { error } = await supabase.from("availability").insert({
    tutor_profile_id: tutorProfileId,
    subject_id: optionalText(formData, "subjectId"),
    day_date: dayDate,
    start_time: startTime,
    end_time: endTime,
    slot_duration_minutes: duration,
    notes: optionalText(formData, "notes"),
  });
  if (error) {
    return { error: "Unable to create availability. Check that the time window does not overlap another one." };
  }

  revalidatePath("/tutor/dashboard");
  return { success: "Availability added and appointment slots generated." };
}

export async function deleteAvailability(formData: FormData) {
  const { profile, supabase } = await requireRoleClient("tutor");

  const tutorProfileId = await getTutorProfileId(supabase, profile.id);
  if (!tutorProfileId) return;

  await supabase
    .from("availability")
    .delete()
    .eq("id", String(formData.get("availabilityId")))
    .eq("tutor_profile_id", tutorProfileId);

  revalidatePath("/tutor/dashboard");
}

export async function updateTutorProfile(
  _previous: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const { profile, supabase } = await requireRoleClient("tutor");

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      headline: optionalText(formData, "headline"),
      bio: optionalText(formData, "bio"),
    })
    .eq("profile_id", profile.id);
  if (error) return { error: "Unable to update your public profile." };

  revalidatePath("/tutor/dashboard");
  revalidatePath("/tutors");
  return { success: "Your public profile was updated." };
}



"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type TutorFormState = { error?: string } | null;

export async function saveTutorApplication(
  _previous: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const profile = await requireRole("tutor");
  const supabase = await createClient();
  const applicationId = String(formData.get("applicationId") ?? "");
  const selectedSubjects = formData.getAll("subjectIds").map(String).filter(Boolean);
  const modes = formData.getAll("preferredModes").map(String).filter(Boolean);
  const graduationYear = Number(formData.get("graduationYear"));
  const yearsExperience = Number(formData.get("yearsExperience"));
  const payload = {
    school_name: String(formData.get("schoolName") ?? "").trim() || null,
    degree: String(formData.get("degree") ?? "").trim() || null,
    major: String(formData.get("major") ?? "").trim() || null,
    graduation_year: graduationYear || null,
    academic_achievements: String(formData.get("academicAchievements") ?? "").trim() || null,
    teaching_experience_summary: String(formData.get("experience") ?? "").trim() || null,
    years_experience: yearsExperience || null,
    teaching_approach: String(formData.get("teachingApproach") ?? "").trim() || null,
    preferred_modes: modes as ("online" | "in_person" | "hybrid")[],
  };

  if (!payload.school_name || !payload.degree || !payload.major || selectedSubjects.length === 0) {
    return { error: "Add your academic details and choose at least one subject." };
  }
  if (!payload.teaching_experience_summary || !payload.teaching_approach) {
    return { error: "Add your teaching experience and approach." };
  }
  if (payload.preferred_modes.length === 0) {
    return { error: "Choose at least one teaching mode." };
  }

  let currentId = applicationId;
  if (currentId) {
    const { error } = await supabase
      .from("tutor_applications")
      .update(payload)
      .eq("id", currentId)
      .eq("tutor_id", profile.id);
    if (error) return { error: "Unable to save your application. Please check the details and try again." };
  } else {
    const { data, error } = await supabase
      .from("tutor_applications")
      .insert({ ...payload, tutor_id: profile.id, status: "draft" })
      .select("id")
      .single();
    if (error || !data) return { error: "Unable to submit your application. Please try again." };
    currentId = data.id;
  }

  await supabase.from("tutor_application_subjects").delete().eq("application_id", currentId);
  const { error: subjectsError } = await supabase.from("tutor_application_subjects").insert(
    selectedSubjects.map((subject_id) => ({ application_id: currentId, subject_id })),
  );
  if (subjectsError) return { error: "Application saved, but subjects could not be saved." };

  const file = formData.get("credential") as File | null;
  const credentialType = String(formData.get("credentialType") ?? "other");
  if (file && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) return { error: "Credential files must be 20 MB or smaller." };
    const storagePath = `${profile.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("tutor-credentials")
      .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) return { error: "Application saved, but the credential upload failed." };
    const { error: credentialError } = await supabase.from("tutor_credentials").insert({
      application_id: currentId,
      credential_type: credentialType as "valid_id" | "diploma" | "certificate" | "teaching_credential" | "other",
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
    });
    if (credentialError) return { error: "Application saved, but the credential record failed." };
  }

  const { error: submitError } = await supabase
    .from("tutor_applications")
    .update({ status: "pending" })
    .eq("id", currentId)
    .eq("tutor_id", profile.id);
  if (submitError) return { error: "Your application was saved, but could not be submitted for review." };

  revalidatePath("/tutor/dashboard");
  return null;
}

export async function createAvailability(
  _previous: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const profile = await requireRole("tutor");
  const supabase = await createClient();
  const { data: tutorProfile } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("profile_id", profile.id)
    .single();
  if (!tutorProfile) return { error: "Your tutor profile is not ready yet." };

  const dayDate = String(formData.get("dayDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const duration = Number(formData.get("duration"));
  if (!dayDate || !startTime || !endTime || !duration) return { error: "Complete the availability fields." };
  if (new Date(`${dayDate}T${startTime}`) <= new Date()) return { error: "Choose a future date and time." };

  const { error } = await supabase.from("availability").insert({
    tutor_profile_id: tutorProfile.id,
    subject_id: String(formData.get("subjectId") ?? "") || null,
    day_date: dayDate,
    start_time: startTime,
    end_time: endTime,
    slot_duration_minutes: duration,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) return { error: "Unable to create availability. Check that the time window does not overlap another one." };
  revalidatePath("/tutor/dashboard");
  return null;
}

export async function deleteAvailability(formData: FormData) {
  const profile = await requireRole("tutor");
  const supabase = await createClient();
  const { data: tutorProfile } = await supabase.from("tutor_profiles").select("id").eq("profile_id", profile.id).single();
  if (!tutorProfile) return;
  await supabase.from("availability").delete().eq("id", String(formData.get("availabilityId"))).eq("tutor_profile_id", tutorProfile.id);
  revalidatePath("/tutor/dashboard");
}

export async function updateTutorProfile(
  _previous: TutorFormState,
  formData: FormData,
): Promise<TutorFormState> {
  const profile = await requireRole("tutor");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      headline: String(formData.get("headline") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
    })
    .eq("profile_id", profile.id);
  if (error) return { error: "Unable to update your public profile." };
  revalidatePath("/tutor/dashboard");
  revalidatePath("/tutors");
  return null;
}

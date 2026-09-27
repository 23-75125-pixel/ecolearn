"use server";

import { revalidatePath } from "next/cache";
import { requireRoleClient, getCurrentProfile } from "@/lib/auth/session";
import { optionalText } from "@/lib/utils/form";

export type BookingState = { error?: string; success?: string } | null;

export async function bookSlot(
  _previous: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const { supabase } = await requireRoleClient("student");

  const slotId = optionalText(formData, "slotId");
  if (!slotId) return { error: "Choose an appointment slot." };

  const { error } = await supabase.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    p_notes: optionalText(formData, "notes"),
  });
  if (error) return { error: error.message.replace(/^.*: /, "") };

  revalidatePath("/student/dashboard");
  revalidatePath("/tutors");
  return { success: "Your appointment is booked." };
}

export async function cancelAppointment(formData: FormData) {
  const { supabase } = await requireRoleClient("student");

  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: String(formData.get("appointmentId")),
    p_reason: optionalText(formData, "reason"),
  });
  if (error) return;

  revalidatePath("/student/dashboard");
}

export async function markNotificationRead(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const { supabase } = await requireRoleClient("student");
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", String(formData.get("notificationId")))
    .eq("profile_id", profile.id);

  revalidatePath("/student/dashboard");
}


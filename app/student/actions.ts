"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";

export type BookingState = { error?: string; success?: string } | null;

export async function bookSlot(_previous: BookingState, formData: FormData): Promise<BookingState> {
  await requireRole("student");
  const supabase = await createClient();
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return { error: "Choose an appointment slot." };
  const { error } = await supabase.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    p_notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) return { error: error.message.replace(/^.*: /, "") };
  revalidatePath("/student/dashboard");
  revalidatePath("/tutors");
  return { success: "Your appointment is booked." };
}

export async function cancelAppointment(formData: FormData) {
  await requireRole("student");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: String(formData.get("appointmentId")),
    p_reason: String(formData.get("reason") ?? "").trim() || null,
  });
  if (error) return;
  revalidatePath("/student/dashboard");
}

export async function markNotificationRead(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", String(formData.get("notificationId"))).eq("profile_id", profile.id);
  revalidatePath("/student/dashboard");
}

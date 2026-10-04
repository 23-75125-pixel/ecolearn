"use server";

import { revalidatePath } from "next/cache";
import { requireRoleClient } from "@/lib/auth/session";
import { noteSchema } from "@/lib/validations/tutor";
import { parseUuid } from "@/lib/validations/common";

export type BookingState = { error?: string; success?: string } | null;

/** Postgres raises friendly messages ("...: This slot is no longer available."); keep only the last part. */
function friendlyDatabaseMessage(message: string) {
  return message.replace(/^.*: /, "");
}

export async function bookSlot(
  _previous: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const { supabase } = await requireRoleClient("student");

  const slotId = parseUuid(formData, "slotId");
  if (!slotId) return { error: "Choose an appointment slot." };

  const notes = noteSchema.safeParse(formData.get("notes"));
  if (!notes.success) return { error: "Notes must be 1000 characters or fewer." };

  const { error } = await supabase.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    p_notes: notes.data ?? null,
  });
  if (error) return { error: friendlyDatabaseMessage(error.message) };

  revalidatePath("/student/dashboard");
  revalidatePath("/tutors");
  return { success: "Your appointment is booked." };
}

export async function cancelAppointment(formData: FormData) {
  const { supabase } = await requireRoleClient("student");

  const appointmentId = parseUuid(formData, "appointmentId");
  if (!appointmentId) return;

  const reason = noteSchema.safeParse(formData.get("reason"));

  await supabase.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
    p_reason: (reason.success ? reason.data : undefined) ?? null,
  });

  revalidatePath("/student/dashboard");
}

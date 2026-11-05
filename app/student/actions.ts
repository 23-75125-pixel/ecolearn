"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoleClient } from "@/lib/auth/session";
import type { AppointmentActionState } from "@/lib/appointments/types";
import { friendlyDatabaseMessage } from "@/lib/utils/db-errors";
import { parseUuid } from "@/lib/validations/common";
import { noteSchema } from "@/lib/validations/tutor";

export type BookingState = { error?: string } | null;

/**
 * Books one open slot through the book_appointment_slot() SQL function, which
 * is the only way an appointment is created (it locks the slot, so two
 * students can never take the same one). On success the student lands on the
 * dashboard, where the new session shows as "waiting for the tutor to confirm".
 */
export async function bookSlot(_previous: BookingState, formData: FormData): Promise<BookingState> {
  const { supabase } = await requireRoleClient("student");

  const slotId = parseUuid(formData, "slotId");
  if (!slotId) return { error: "Choose a session time." };

  const notes = noteSchema.safeParse(formData.get("notes"));
  if (!notes.success) return { error: "Notes must be 1000 characters or fewer." };

  const { error } = await supabase.rpc("book_appointment_slot", {
    p_slot_id: slotId,
    p_notes: notes.data ?? null,
  });
  if (error) return { error: friendlyDatabaseMessage(error, "We couldn't book this session. Please try again.") };

  revalidatePath("/student/dashboard");
  revalidatePath("/student/tutors", "layout");
  redirect("/student/dashboard?booked=1");
}

export async function cancelAppointment(
  _previous: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const { supabase } = await requireRoleClient("student");

  const appointmentId = parseUuid(formData, "appointmentId");
  if (!appointmentId) return { error: "This session could not be found." };

  const reason = noteSchema.safeParse(formData.get("reason"));
  if (!reason.success) return { error: "The reason must be 500 characters or fewer." };

  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
    p_reason: reason.data ?? null,
  });
  if (error) return { error: friendlyDatabaseMessage(error, "We couldn't cancel this session. Please try again.") };

  revalidatePath("/student/dashboard");
  return null;
}

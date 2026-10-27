"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseUuid } from "@/lib/validations/common";
import { ROLE_HOME } from "@/lib/constants/roles";

/** Marks one of the signed-in user's own notifications as read (any role). */
export async function markNotificationRead(formData: FormData) {
  const profile = await getCurrentProfile();
  const notificationId = parseUuid(formData, "notificationId");
  if (!profile || !notificationId) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("profile_id", profile.id);

  revalidatePath(ROLE_HOME[profile.role]);
}

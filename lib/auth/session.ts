import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database.types";

export type CurrentProfile = {
  id: string;
  role: AppRole;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
};

/**
 * Reads the current user's profile from the database (not just the JWT),
 * so a role change by an admin takes effect immediately rather than
 * waiting for token refresh. Returns null when signed out.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  return profile;
}

const ROLE_HOME: Record<AppRole, string> = {
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Server-side guard for a role-specific layout/page. `proxy.ts` already
 * redirects most misrouted requests before they get here — this is the
 * defense-in-depth copy for the (rare, but possible) case a Server
 * Component renders without going through the proxy, e.g. a Server Action
 * revalidating a path. Never the only check for anything that reads or
 * writes data; RLS is that check.
 */
export async function requireRole(role: AppRole): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(ROLE_HOME[role])}`);
  }
  if (profile.role !== role) {
    redirect(ROLE_HOME[profile.role]);
  }
  return profile;
}

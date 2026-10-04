import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/constants/roles";
import type { AppRole } from "@/types/database.types";

export type CurrentProfile = {
  id: string;
  role: AppRole;
  first_name: string;
  last_name: string;
  /** False until the user has accepted the Terms and Privacy Policy. */
  termsAccepted: boolean;
};

/**
 * Reads the current user's profile from the database (not just the JWT),
 * so a role change by an admin takes effect immediately rather than
 * waiting for token refresh. Returns null when signed out.
 *
 * Wrapped in `cache()` so a layout and its page share one lookup per request.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: termsAccepted }] = await Promise.all([
    supabase.from("profiles").select("id, role, first_name, last_name").eq("id", user.id).maybeSingle(),
    supabase.rpc("has_accepted_terms"),
  ]);
  if (!profile) return null;

  return { ...profile, termsAccepted: termsAccepted === true };
});

/**
 * Server-side guard for a role-specific layout/page. `proxy.ts` already
 * redirects most misrouted requests before they get here — this is the
 * defense-in-depth copy for the (rare, but possible) case a Server
 * Component renders without going through the proxy, e.g. a Server Action
 * revalidating a path. Never the only check for anything that reads or
 * writes data; RLS is that check.
 *
 * Accounts that have not accepted the Terms yet (for example, first-time
 * Google sign-ins) are sent to finish sign-up before they can use the app.
 */
export async function requireRole(role: AppRole): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(ROLE_HOME[role])}`);
  }
  if (!profile.termsAccepted) {
    redirect("/complete-signup");
  }
  if (profile.role !== role) {
    redirect(ROLE_HOME[profile.role]);
  }
  return profile;
}

/**
 * Standard entry point for role-guarded Server Actions: verifies the
 * caller's role and returns both the profile and an authenticated
 * Supabase client, so every action starts with one line instead of two.
 */
export async function requireRoleClient(role: AppRole) {
  const profile = await requireRole(role);
  const supabase = await createClient();
  return { profile, supabase };
}

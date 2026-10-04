import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

/**
 * Landing route for every emailed or OAuth link (email confirmation,
 * password reset, Google sign-in): swaps the `code` for a session, then
 * sends the user on to `next`, or to their own dashboard when there is none.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "");

  // Google redirects here with ?error=... when the user cancels.
  if (searchParams.get("error")) {
    return NextResponse.redirect(new URL("/login?notice=sign_in_failed", origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (next) return NextResponse.redirect(new URL(next, origin));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        : { data: null };
      return NextResponse.redirect(new URL(ROLE_HOME[profile?.role ?? "student"], origin));
    }
  }

  return NextResponse.redirect(new URL("/login?notice=invalid_link", origin));
}

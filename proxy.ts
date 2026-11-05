import { NextResponse, type NextRequest } from "next/server";
import { decideAccess } from "@/lib/auth/access";
import { ROLE_PREFIXES } from "@/lib/constants/roles";
import { updateSession } from "@/lib/supabase/middleware";
import type { AppRole } from "@/types/database.types";

/**
 * Next.js 16 renamed `middleware.ts` -> `proxy.ts` (and the exported
 * `middleware` function -> `proxy`). This is the network boundary: it
 * refreshes the Supabase session on every page request and applies the access
 * rules in `lib/auth/access.ts`.
 *
 * This is the first line of defence and a UX convenience, NOT the security
 * boundary: every table has RLS, every SQL function checks the caller, and
 * every Server Action re-checks the caller's role. Bouncing a request here
 * never substitutes for that.
 */

function unavailable(message: string) {
  return new NextResponse(message, {
    status: 503,
    headers: { "Retry-After": "5", "Cache-Control": "no-store" },
  });
}

export async function proxy(request: NextRequest) {
  const { response, supabase, user, authError } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isRoleSection = ROLE_PREFIXES.some(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // If we cannot verify who this is, never guess: a role section must not open,
  // and any other page is shown to the visitor as a guest.
  if (authError) {
    console.warn("Supabase auth verification unavailable:", authError.message);
    if (isRoleSection) return unavailable("Authentication service temporarily unavailable. Please try again.");
  }

  let role: AppRole | null = null;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      console.warn("Profile role lookup failed:", profileError.message);
      return unavailable("Account authorization is temporarily unavailable. Please try again.");
    }
    if (!profile) {
      return new NextResponse("Your account profile is not available.", {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
    role = profile.role;
  }

  const decision = decideAccess({ pathname, role });
  if (decision.type === "redirect") {
    const target = new URL(decision.to, request.url);
    const redirect = NextResponse.redirect(target);
    // Keep any refreshed auth cookies on the redirect response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Every page and route handler, except static files and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)$).*)",
  ],
};

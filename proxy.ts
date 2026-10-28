import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { AUTH_PATHS, ROLE_HOME, ROLE_PREFIXES } from "@/lib/constants/roles";
import type { AppRole } from "@/types/database.types";

/**
 * Next.js 16 renamed `middleware.ts` -> `proxy.ts` (and the exported
 * `middleware` function -> `proxy`). This is the network boundary: it
 * refreshes the Supabase session on every request and redirects requests
 * that don't belong in a given role's section.
 *
 * This is a UX convenience, NOT the security boundary — every table has
 * RLS, and every Server Action re-checks the caller's role server-side.
 * Hiding a link or bouncing a request here never substitutes for that.
 */

export async function proxy(request: NextRequest) {
  const { response, supabase, user, authError } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const matchedRolePrefix = ROLE_PREFIXES.find(({ prefix }) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (matchedRolePrefix && authError) {
    console.warn("Supabase auth verification unavailable:", authError.message);
    return new NextResponse("Authentication service temporarily unavailable. Please try again.", {
      status: 503,
      headers: { "Retry-After": "5", "Cache-Control": "no-store" },
    });
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
      if (matchedRolePrefix) {
        return new NextResponse("Account authorization is temporarily unavailable. Please try again.", {
          status: 503,
          headers: { "Retry-After": "5", "Cache-Control": "no-store" },
        });
      }
    }
    role = profile?.role ?? null;
  }

  if (matchedRolePrefix) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (!role) {
      return new NextResponse("Your account profile is not available.", {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (role !== matchedRolePrefix.role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
    }
  }

  if (user && role && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // Signed-in users must not access the public homepage — redirect to their
  // role dashboard. Only guests may view the landing page and footer.
  if (user && role && pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/student/:path*",
    "/tutor/:path*",
    "/admin/:path*",
  ],
};

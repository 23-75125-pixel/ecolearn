import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
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
const ROLE_HOME: Record<AppRole, string> = {
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
  admin: "/admin/dashboard",
};

const ROLE_PREFIXES: { prefix: string; role: AppRole }[] = [
  { prefix: "/student", role: "student" },
  { prefix: "/tutor", role: "tutor" },
  { prefix: "/admin", role: "admin" },
];

const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  let role: AppRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (profile?.role as AppRole | undefined) ?? null;
  }

  const matchedRolePrefix = ROLE_PREFIXES.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (matchedRolePrefix) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (role && role !== matchedRolePrefix.role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
    }
  }

  if (user && role && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

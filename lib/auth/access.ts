import {
  GUEST_ONLY_PATHS,
  GUEST_ONLY_PREFIXES,
  PUBLIC_TUTORS_PATH,
  ROLE_HOME,
  ROLE_PREFIXES,
  STUDENT_TUTORS_PATH,
} from "@/lib/constants/roles";
import type { AppRole } from "@/types/database.types";

export type AccessDecision = { type: "allow" } | { type: "redirect"; to: string };

const ALLOW: AccessDecision = { type: "allow" };

function redirectTo(to: string): AccessDecision {
  return { type: "redirect", to };
}

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * The single place that decides who may open which page. `proxy.ts` calls it
 * for every request, so it is a pure function (no cookies, no database) that
 * the unit tests can cover completely.
 *
 *   guest      -> landing page, About, tutor directory, sign-in pages, legal pages
 *   student    -> /student/**  only (including the tutor directory at /student/tutors)
 *   tutor      -> /tutor/**    only
 *   admin      -> /admin/**    only
 *
 * Open to everyone: /terms, /privacy, /callback (sign-in links), /reset-password
 * (it needs the recovery session its email link creates) and /complete-signup
 * (signed-in users only, until they accept the Terms).
 */
export function decideAccess({ pathname, role }: { pathname: string; role: AppRole | null }): AccessDecision {
  const section = ROLE_PREFIXES.find(({ prefix }) => isUnder(pathname, prefix));

  if (section) {
    if (!role) return redirectTo(`/login?next=${encodeURIComponent(pathname)}`);
    return role === section.role ? ALLOW : redirectTo(ROLE_HOME[role]);
  }

  if (pathname === "/complete-signup") {
    return role ? ALLOW : redirectTo("/login");
  }

  const guestOnly =
    GUEST_ONLY_PATHS.some((path) => path === pathname) ||
    GUEST_ONLY_PREFIXES.some((prefix) => isUnder(pathname, prefix));

  if (guestOnly && role) {
    // A student keeps browsing tutors, but inside the student section.
    if (role === "student" && isUnder(pathname, PUBLIC_TUTORS_PATH)) {
      return redirectTo(pathname.replace(PUBLIC_TUTORS_PATH, STUDENT_TUTORS_PATH));
    }
    return redirectTo(ROLE_HOME[role]);
  }

  return ALLOW;
}

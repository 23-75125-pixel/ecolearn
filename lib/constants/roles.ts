import type { AppRole } from "@/types/database.types";

/** Landing dashboard route for each role after sign-in. */
export const ROLE_HOME: Record<AppRole, string> = {
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
  admin: "/admin/dashboard",
};

/** URL prefixes reserved for each role's section of the app. */
export const ROLE_PREFIXES: { prefix: string; role: AppRole }[] = [
  { prefix: "/student", role: "student" },
  { prefix: "/tutor", role: "tutor" },
  { prefix: "/admin", role: "admin" },
];

/**
 * Pages meant for visitors who are NOT signed in: the landing page (with its
 * footer), the public tutor directory, and the sign-in pages. A signed-in user
 * is always sent back to their own section.
 */
export const GUEST_ONLY_PATHS = ["/", "/about", "/login", "/register", "/forgot-password"] as const;
export const GUEST_ONLY_PREFIXES = ["/tutors"] as const;

/** The public tutor directory, and where a signed-in student finds the same pages. */
export const PUBLIC_TUTORS_PATH = "/tutors";
export const STUDENT_TUTORS_PATH = "/student/tutors";

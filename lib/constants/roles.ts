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

/** Auth pages a signed-in user should never see. */
export const AUTH_PATHS = ["/login", "/register"];

import { STUDENT_TUTORS_PATH } from "@/lib/constants/roles";
import type { AppRole } from "@/types/database.types";

export type NavLink = { href: string; label: string };

/** Navigation links shown to a signed-in user. Each role only ever sees its own section. */
export const ROLE_NAV: Record<AppRole, NavLink[]> = {
  student: [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: STUDENT_TUTORS_PATH, label: "Find Tutors" },
  ],
  tutor: [{ href: "/tutor/dashboard", label: "Dashboard" }],
  admin: [{ href: "/admin/dashboard", label: "Dashboard" }],
};

/** Navigation links shown to guests. */
export const GUEST_NAV: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/tutors", label: "Find Tutors" },
  { href: "/about", label: "About" },
];

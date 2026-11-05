import { describe, expect, it } from "vitest";
import { decideAccess } from "@/lib/auth/access";
import type { AppRole } from "@/types/database.types";

const allow = { type: "allow" };
const to = (path: string) => ({ type: "redirect", to: path });
const access = (pathname: string, role: AppRole | null) => decideAccess({ pathname, role });

const HOME: Record<AppRole, string> = {
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
  admin: "/admin/dashboard",
};

describe("guests", () => {
  it.each(["/", "/about", "/tutors", "/tutors/abc", "/login", "/register", "/forgot-password", "/terms", "/privacy", "/reset-password", "/callback"])(
    "may open %s",
    (path) => expect(access(path, null)).toEqual(allow),
  );

  it.each(["/student/dashboard", "/student/tutors", "/tutor/dashboard", "/admin/dashboard", "/admin/metrics/students"])(
    "are sent to log in from %s, and come back afterwards",
    (path) => expect(access(path, null)).toEqual(to(`/login?next=${encodeURIComponent(path)}`)),
  );

  it("cannot open complete-signup", () => {
    expect(access("/complete-signup", null)).toEqual(to("/login"));
  });
});

describe.each(["student", "tutor", "admin"] as const)("a signed-in %s", (role) => {
  it.each(["/", "/about", "/login", "/register", "/forgot-password"])("cannot see the guest page %s", (path) => {
    expect(access(path, role)).toEqual(to(HOME[role]));
  });

  it("may open their own section", () => {
    expect(access(HOME[role], role)).toEqual(allow);
  });

  it("is sent home from another role's section", () => {
    for (const other of ["student", "tutor", "admin"] as const) {
      if (other !== role) expect(access(HOME[other], role)).toEqual(to(HOME[role]));
    }
  });

  it("may still read the Terms and Privacy Policy, and finish sign-up", () => {
    expect(access("/terms", role)).toEqual(allow);
    expect(access("/privacy", role)).toEqual(allow);
    expect(access("/complete-signup", role)).toEqual(allow);
    expect(access("/reset-password", role)).toEqual(allow);
  });
});

describe("the tutor directory", () => {
  it("moves a signed-in student into the student section", () => {
    expect(access("/tutors", "student")).toEqual(to("/student/tutors"));
    expect(access("/tutors/3f2504e0", "student")).toEqual(to("/student/tutors/3f2504e0"));
  });

  it("is not for tutors or admins", () => {
    expect(access("/tutors", "tutor")).toEqual(to("/tutor/dashboard"));
    expect(access("/tutors/abc", "admin")).toEqual(to("/admin/dashboard"));
  });

  it("is open to students inside their section only", () => {
    expect(access("/student/tutors", "student")).toEqual(allow);
    expect(access("/student/tutors/abc", "student")).toEqual(allow);
    expect(access("/student/tutors", "tutor")).toEqual(to("/tutor/dashboard"));
  });
});

describe("path matching", () => {
  it("does not treat look-alike prefixes as a role section", () => {
    expect(access("/students-guide", null)).toEqual(allow);
    expect(access("/tutors-wanted", "tutor")).toEqual(allow);
    expect(access("/administrator", "student")).toEqual(allow);
  });
});

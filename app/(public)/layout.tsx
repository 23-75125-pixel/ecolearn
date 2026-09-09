import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/nav/navbar";
import { getCurrentProfile } from "@/lib/auth/session";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tutors", label: "Find Tutors" },
  { href: "/about", label: "About" },
];

const ROLE_HOME: Record<string, string> = {
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
  admin: "/admin/dashboard",
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brandHref="/"
        links={PUBLIC_LINKS}
        rightSlot={
          profile ? (
            <Link
              href={ROLE_HOME[profile.role]}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
              >
                Register
              </Link>
            </>
          )
        }
      />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} ECoLearn. All rights reserved.
      </footer>
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/nav/navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentProfile, SessionUnavailableError } from "@/lib/auth/session";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tutors", label: "Find Tutors" },
  { href: "/about", label: "About" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile().catch((error: unknown) => {
    if (error instanceof SessionUnavailableError) return null;
    throw error;
  });

  // Signed-in users must not access public pages — proxy.ts redirects them
  // to their role dashboard. This layout only renders for guests.
  if (profile) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brandHref="/"
        links={PUBLIC_LINKS}
        rightSlot={
          <>
            <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>Log in</Link>
            <Link href="/register" className={buttonClasses({ size: "sm" })}>Register</Link>
          </>
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

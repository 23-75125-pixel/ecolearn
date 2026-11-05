import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/nav/navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { GUEST_NAV } from "@/lib/constants/navigation";

/** The guest-facing site: landing page, About and the public tutor directory, with the marketing footer. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brandHref="/"
        links={GUEST_NAV}
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

import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import { Navbar } from "@/components/nav/navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants/roles";
import { ICON_INLINE } from "@/lib/ui/styles";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tutors", label: "Find Tutors" },
  { href: "/about", label: "About" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brandHref="/"
        links={PUBLIC_LINKS}
        rightSlot={
          profile ? (
            <Link href={ROLE_HOME[profile.role]} className={buttonClasses({ size: "sm" })}>
              <LayoutDashboard className={ICON_INLINE} />
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                Log in
              </Link>
              <Link href="/register" className={buttonClasses({ size: "sm" })}>
                Register
              </Link>
            </>
          )
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

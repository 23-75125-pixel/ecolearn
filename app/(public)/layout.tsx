import Link from "next/link";
import type { ReactNode } from "react";
<<<<<<< HEAD
import { Navbar } from "@/components/nav/navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentProfile, SessionUnavailableError } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants/roles";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { ICON_INLINE } from "@/lib/ui/styles";
import { LayoutDashboard } from "lucide-react";
=======
import { LayoutDashboard } from "lucide-react";
import { Navbar } from "@/components/nav/navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants/roles";
import { ICON_INLINE } from "@/lib/ui/styles";
>>>>>>> origin/main

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tutors", label: "Find Tutors" },
  { href: "/about", label: "About" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
<<<<<<< HEAD
  const profile = await getCurrentProfile().catch((error: unknown) => {
    if (error instanceof SessionUnavailableError) return null;
    throw error;
  });
=======
  const profile = await getCurrentProfile();
>>>>>>> origin/main

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brandHref="/"
        links={PUBLIC_LINKS}
<<<<<<< HEAD
        rightSlot={profile ? (
          <div className="flex items-center gap-3">
            <ProfileAvatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              avatarUrl={profile.avatar_url}
              size="sm"
            />
            <Link href={ROLE_HOME[profile.role]} className={buttonClasses({ size: "sm" })}>
              <LayoutDashboard className={ICON_INLINE} />
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <>
            <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link href="/register" className={buttonClasses({ size: "sm" })}>
              Register
            </Link>
          </>
        )}
=======
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
>>>>>>> origin/main
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

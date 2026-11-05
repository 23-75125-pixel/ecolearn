import type { ReactNode } from "react";
import { Navbar } from "@/components/nav/navbar";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { requireRole } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants/roles";
import { ROLE_NAV } from "@/lib/constants/navigation";
import { SUBTEXT } from "@/lib/ui/styles";
import type { AppRole } from "@/types/database.types";

/**
 * The page frame shared by the student, tutor and admin sections: it checks
 * the role (a second guard behind proxy.ts), then shows that role's navigation,
 * the user's avatar and the sign-out button. There is no footer here: the
 * marketing footer belongs to the guest landing page only.
 */
export async function RoleShell({ role, children }: { role: AppRole; children: ReactNode }) {
  const profile = await requireRole(role);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brandHref={ROLE_HOME[role]}
        links={ROLE_NAV[role]}
        rightSlot={
          <div className="flex items-center gap-3">
            <ProfileAvatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              avatarUrl={profile.avatar_url}
              size="sm"
            />
            <span className={SUBTEXT}>{profile.first_name}</span>
            <SignOutButton />
          </div>
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}

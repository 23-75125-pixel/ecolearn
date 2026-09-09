import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";
import { Navbar } from "@/components/nav/navbar";
import { SignOutButton } from "@/components/nav/sign-out-button";

const ADMIN_LINKS = [{ href: "/admin/dashboard", label: "Dashboard" }];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar
        brandHref="/admin/dashboard"
        links={ADMIN_LINKS}
        rightSlot={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{profile.first_name}</span>
            <SignOutButton />
          </div>
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}

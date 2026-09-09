"use client";

import { signOut } from "@/app/(auth)/actions";
import { ConfirmSubmit } from "@/components/ui/action-dialog";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <ConfirmSubmit message="Are you sure you want to sign out?" className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-surface">
        <LogOut size={15} />
        Sign out
      </ConfirmSubmit>
    </form>
  );
}

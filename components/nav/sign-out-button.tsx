"use client";

import { signOut } from "@/app/(auth)/actions";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/action-dialog";
import { ICON } from "@/lib/ui/styles";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <ConfirmSubmit
        message="Are you sure you want to sign out?"
        className={buttonClasses({ variant: "secondary", size: "sm" })}
      >
        <LogOut className={ICON} />
        Sign out
      </ConfirmSubmit>
    </form>
  );
}

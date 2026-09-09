"use client";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut size={15} />
        Sign out
      </Button>
    </form>
  );
}

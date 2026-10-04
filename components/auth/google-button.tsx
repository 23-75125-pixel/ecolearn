"use client";

import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.34v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.36 14.32a7.2 7.2 0 0 1 0-4.64V6.59H1.34a12 12 0 0 0 0 10.82l4.02-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.34 6.59l4.02 3.09A7.16 7.16 0 0 1 12 4.75z" />
    </svg>
  );
}

function GoogleSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" className="w-full" isLoading={pending}>
      {!pending && <GoogleLogo />}
      {label}
    </Button>
  );
}

/** "or" line between the email form and the Google button. */
function OrDivider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
      <span className={SUBTEXT}>or</span>
      <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
    </div>
  );
}

/**
 * Google sign-in as its own <form>, so it must be rendered OUTSIDE the
 * email/password form (HTML does not allow nested forms).
 */
export function GoogleSignIn({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <OrDivider />
      <form action={signInWithGoogle}>
        <GoogleSubmit label={label} />
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { completeSignup, signOut, type FormState } from "@/app/(auth)/actions";
import { RoleSelector, type SignupRole } from "@/components/auth/role-selector";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";
import { ActionDialog } from "@/components/ui/action-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SUBTEXT, TEXT_LINK } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const initialState: FormState = null;

type CompleteSignupFormProps = {
  /** Admins keep their role, so only students and tutors see the role choice. */
  defaultRole: SignupRole | null;
};

export function CompleteSignupForm({ defaultRole }: CompleteSignupFormProps) {
  const [state, formAction, isPending] = useActionState(completeSignup, initialState);
  const [role, setRole] = useState<SignupRole>(defaultRole ?? "student");

  return (
    <>
      <form action={formAction} className="space-y-4" noValidate>
        {state?.error && <Alert>{state.error}</Alert>}

        {defaultRole && <RoleSelector value={role} onChange={setRole} error={state?.fieldErrors?.role} />}

        <TermsCheckbox error={state?.fieldErrors?.acceptTerms} />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Continue
        </Button>
        <ActionDialog error={state?.error} />
      </form>

      <form action={signOut} className={cn(SUBTEXT, "mt-6 text-center")}>
        Not you?{" "}
        <button type="submit" className={TEXT_LINK}>
          Sign out
        </button>
      </form>
    </>
  );
}

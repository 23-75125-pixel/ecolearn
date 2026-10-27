"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/app/(auth)/actions";
import { PasswordField } from "@/components/auth/password-field";
import { ActionDialog } from "@/components/ui/action-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const initialState: FormState = null;

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}

      <PasswordField
        id="password"
        label="New password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        toggleName="new password"
        error={state?.fieldErrors?.password}
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        placeholder="Re-enter your new password"
        autoComplete="new-password"
        toggleName="confirmation password"
        error={state?.fieldErrors?.confirmPassword}
      />

      <Button type="submit" className="w-full" isLoading={isPending}>
        Update password
      </Button>
      <ActionDialog error={state?.error} />
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Phone, UserRound } from "lucide-react";
import { signUp, type FormState } from "../actions";
import { GoogleSignIn } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { RoleSelector, type SignupRole } from "@/components/auth/role-selector";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { ActionDialog } from "@/components/ui/action-dialog";
import { ICON, SUBTEXT, TEXT_LINK } from "@/lib/ui/styles";

const initialState: FormState = null;

const FIELD_ICON = cn(ICON, "pointer-events-none absolute left-3 top-3");

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<SignupRole>("student");

  if (state?.message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Almost there</CardTitle>
        </CardHeader>
        <p className="text-sm">{state.message}</p>
        <Link href="/login" className={cn("mt-6", TEXT_LINK)}>
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join ECoLearn as a student or a tutor.</CardDescription>
      </CardHeader>

      <form action={formAction} className="space-y-4" noValidate>
        {state?.error && <Alert>{state.error}</Alert>}

        <RoleSelector value={role} onChange={setRole} error={state?.fieldErrors?.role} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <div className="relative"><UserRound aria-hidden="true" className={FIELD_ICON} /><Input id="firstName" name="firstName" placeholder="Juan" required invalid={!!state?.fieldErrors?.firstName} className="pl-10" /></div>
            <FieldError>{state?.fieldErrors?.firstName}</FieldError>
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <div className="relative"><UserRound aria-hidden="true" className={FIELD_ICON} /><Input id="lastName" name="lastName" placeholder="Dela Cruz" required invalid={!!state?.fieldErrors?.lastName} className="pl-10" /></div>
            <FieldError>{state?.fieldErrors?.lastName}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone number (optional)</Label>
          <div className="relative"><Phone aria-hidden="true" className={FIELD_ICON} /><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0917 123 4567" invalid={!!state?.fieldErrors?.phone} className="pl-10" /></div>
          <FieldError>{state?.fieldErrors?.phone}</FieldError>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative"><Mail aria-hidden="true" className={FIELD_ICON} /><Input id="email" name="email" type="email" autoComplete="email" placeholder="juan@example.com" required invalid={!!state?.fieldErrors?.email} className="pl-10" /></div>
          <FieldError>{state?.fieldErrors?.email}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PasswordField
            id="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={state?.fieldErrors?.password}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            toggleName="confirmation password"
            error={state?.fieldErrors?.confirmPassword}
          />
        </div>

        <TermsCheckbox error={state?.fieldErrors?.acceptTerms} />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Create account
        </Button>
        <ActionDialog error={state?.error} />
      </form>

      <GoogleSignIn label="Sign up with Google" className="mt-4" />
      <p className={cn(SUBTEXT, "mt-3 text-center")}>
        With Google, you&apos;ll review and accept our terms on the next screen.
      </p>

      <p className={cn(SUBTEXT, "mt-6 text-center")}>
        Already have an account?{" "}
        <Link href="/login" className={TEXT_LINK}>
          Sign in
        </Link>
      </p>
    </Card>
  );
}

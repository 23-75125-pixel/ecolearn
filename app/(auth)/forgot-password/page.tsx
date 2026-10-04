"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActionDialog } from "@/components/ui/action-dialog";
import { ICON, SUBTEXT, TEXT_LINK } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const initialState: FormState = null;

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  if (state?.message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <p className="text-sm">{state.message}</p>
        <p className={cn(SUBTEXT, "mt-3 leading-6")}>
          The link works for a limited time. Open it in the same browser you used here.
        </p>
        <Link href="/login" className={cn("mt-6", TEXT_LINK)}>
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a link to reset it.</CardDescription>
      </CardHeader>

      <form action={formAction} className="space-y-4" noValidate>
        {state?.error && <Alert>{state.error}</Alert>}

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail aria-hidden="true" className={cn(ICON, "pointer-events-none absolute left-3 top-3")} />
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="juan@example.com" required invalid={!!state?.fieldErrors?.email} className="pl-10" />
          </div>
          <FieldError>{state?.fieldErrors?.email}</FieldError>
        </div>

        <Button type="submit" className="w-full" isLoading={isPending}>
          Send reset link
        </Button>
        <ActionDialog error={state?.error} />
      </form>

      <p className={cn(SUBTEXT, "mt-6 text-center")}>
        Remembered it?{" "}
        <Link href="/login" className={TEXT_LINK}>
          Sign in
        </Link>
      </p>
    </Card>
  );
}

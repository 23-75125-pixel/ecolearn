"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { signIn, type FormState } from "../actions";
import { GoogleSignIn } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActionDialog } from "@/components/ui/action-dialog";
import { isLoginNoticeCode, LOGIN_NOTICES } from "@/lib/constants/notices";
import { ICON, SUBTEXT, TEXT_LINK } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const initialState: FormState = null;

function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state?.error && <Alert>{state.error}</Alert>}

      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail aria-hidden="true" className={cn(ICON, "pointer-events-none absolute left-3 top-3")} />
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="juan@example.com" required invalid={!!state?.fieldErrors?.email} className="pl-10" />
        </div>
        <FieldError>{state?.fieldErrors?.email}</FieldError>
      </div>

      <div className="space-y-1.5">
        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={state?.fieldErrors?.password}
        />
        <div className="text-right">
          <Link href="/forgot-password" className={cn(TEXT_LINK, "text-sm")}>
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Sign in
      </Button>
      <ActionDialog
        error={state?.error}
        success={state?.success}
        onClose={() => state?.redirectTo && router.push(state.redirectTo)}
      />
    </form>
  );
}

function LoginNotice() {
  const searchParams = useSearchParams();
  const code = searchParams.get("notice");
  if (!isLoginNoticeCode(code)) return null;

  const { type, message } = LOGIN_NOTICES[code];
  return <ActionDialog error={type === "error" ? message : undefined} success={type === "success" ? message : undefined} />;
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to ECoLearn.</CardDescription>
      </CardHeader>

      <Suspense fallback={null}>
        <LoginNotice />
      </Suspense>

      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      <GoogleSignIn label="Continue with Google" className="mt-4" />

      <p className={cn(SUBTEXT, "mt-6 text-center")}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className={TEXT_LINK}>
          Register
        </Link>
      </p>
    </Card>
  );
}

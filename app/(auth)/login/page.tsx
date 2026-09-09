"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: FormState = null;

function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          invalid={!!state?.fieldErrors?.email}
        />
        <FieldError>{state?.fieldErrors?.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={!!state?.fieldErrors?.password}
        />
        <FieldError>{state?.fieldErrors?.password}</FieldError>
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to ECoLearn.</CardDescription>
      </CardHeader>

      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary-600 hover:underline">
          Register
        </Link>
      </p>
    </Card>
  );
}

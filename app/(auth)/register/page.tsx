"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { signUp, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { ActionDialog } from "@/components/ui/action-dialog";

const initialState: FormState = null;

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (state?.message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Almost there</CardTitle>
        </CardHeader>
        <p className="text-sm text-foreground">{state.message}</p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary-600 hover:underline"
        >
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
        {state?.error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-foreground">
            I&apos;m joining as a...
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["student", "tutor"] as const).map((option) => (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium capitalize",
                  role === option
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-border text-foreground hover:bg-surface",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                  className="sr-only"
                />
                {option === "student" ? <BookOpenCheck aria-hidden="true" size={16} /> : <GraduationCap aria-hidden="true" size={16} />}
                {option}
              </label>
            ))}
          </div>
          <FieldError>{state?.fieldErrors?.role}</FieldError>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <div className="relative"><UserRound aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><Input id="firstName" name="firstName" required invalid={!!state?.fieldErrors?.firstName} className="pl-10" /></div>
            <FieldError>{state?.fieldErrors?.firstName}</FieldError>
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <div className="relative"><UserRound aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><Input id="lastName" name="lastName" required invalid={!!state?.fieldErrors?.lastName} className="pl-10" /></div>
            <FieldError>{state?.fieldErrors?.lastName}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone number (optional)</Label>
          <div className="relative"><Phone aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><Input id="phone" name="phone" type="tel" autoComplete="tel" className="pl-10" /></div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative"><Mail aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><Input id="email" name="email" type="email" autoComplete="email" required invalid={!!state?.fieldErrors?.email} className="pl-10" /></div>
          <FieldError>{state?.fieldErrors?.email}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative"><LockKeyhole aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required invalid={!!state?.fieldErrors?.password} className="pl-10 pr-10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-2.5 text-muted hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            <FieldError>{state?.fieldErrors?.password}</FieldError>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative"><LockKeyhole aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-muted" /><Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required invalid={!!state?.fieldErrors?.confirmPassword} className="pl-10 pr-10" /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-3 top-2.5 text-muted hover:text-foreground" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} title={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            <FieldError>{state?.fieldErrors?.confirmPassword}</FieldError>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isPending}>
          Create account
        </Button>
        <ActionDialog error={state?.error} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

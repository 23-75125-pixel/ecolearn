"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";
import { getSiteUrl } from "@/lib/utils/site-url";
import {
  completeSignupSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type { AppRole } from "@/types/database.types";

export type FormState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
} | null;

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Where the emailed / OAuth link should land after Supabase verifies it. */
function callbackUrl(next?: string) {
  const base = `${getSiteUrl()}/callback`;
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

/* ---------------------------------------------------------------------------
 * Email + password
 * ------------------------------------------------------------------------- */

export async function signIn(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Please verify your email address first, then sign in again." };
    }
    // Deliberately generic — never confirm whether the email is registered.
    return { error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role: AppRole = profile?.role ?? "student";
  const next = safeRedirectPath(formData.get("next"), ROLE_HOME[role]);

  // Only follow `next` when it stays inside this user's own section.
  const isOwnSection = next === ROLE_HOME[role] || next.startsWith(`/${role}/`);
  return {
    success: "Login successful. Welcome back!",
    redirectTo: isOwnSection ? next : ROLE_HOME[role],
  };
}

export async function signUp(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    role: formData.get("role"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const { role, firstName, lastName, phone, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        terms_accepted: true,
      },
      emailRedirectTo: callbackUrl(ROLE_HOME[role]),
    },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "An account with that email already exists."
          : "We couldn't create your account. Please try again.",
    };
  }

  if (data.session) {
    redirect(ROLE_HOME[role]);
  }

  return {
    message: "Check your email to confirm your account before signing in.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed_out");
}

/* ---------------------------------------------------------------------------
 * Google
 * ------------------------------------------------------------------------- */

/**
 * Starts the Google sign-in. Supabase creates the account on first use;
 * `/callback` then sends new users to `/complete-signup` to accept the Terms.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl() },
  });

  if (error || !data.url) redirect("/login?notice=sign_in_failed");
  redirect(data.url);
}

/** Final step for new Google accounts: accept the Terms and, optionally, pick a role. */
export async function completeSignup(_prevState: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.termsAccepted) redirect(ROLE_HOME[profile.role]);

  const parsed = completeSignupSchema.safeParse({
    // Admins cannot choose a role here, so the field is not sent for them.
    role: formData.get("role") ?? undefined,
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_signup", { p_role: parsed.data.role ?? null });
  if (error) return { error: "We couldn't finish setting up your account. Please try again." };

  // Read the role again: the database may have changed it just now.
  const { data: updated } = await supabase.from("profiles").select("role").eq("id", profile.id).single();
  redirect(ROLE_HOME[updated?.role ?? profile.role]);
}

/* ---------------------------------------------------------------------------
 * Forgot / reset password
 * ------------------------------------------------------------------------- */

export async function requestPasswordReset(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/reset-password"),
  });

  if (error?.code === "over_email_send_rate_limit") {
    return { error: "Too many requests. Please wait a minute and try again." };
  }
  if (error) return { error: "We couldn't send the reset email. Please try again." };

  // Same answer whether or not the email is registered, so this form can't be used to find accounts.
  return { message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function updatePassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password that is different from your current one."
          : "We couldn't update your password. Please try again.",
    };
  }

  // End every session so the new password is used from now on.
  await supabase.auth.signOut();
  redirect("/login?notice=password_updated");
}

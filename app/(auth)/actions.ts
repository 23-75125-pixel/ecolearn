"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { AppRole } from "@/types/database.types";

export type FormState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
} | null;

const ROLE_HOME: Record<AppRole, string> = {
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
  admin: "/admin/dashboard",
};

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function signIn(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please verify your email address first, then sign in again." };
    }
    // Deliberately generic — never confirm whether the email is registered.
    return { error: "Invalid email or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const role = (profile?.role as AppRole | undefined) ?? "student";
  const requestedNext = formData.get("next");
  const next =
    typeof requestedNext === "string" && requestedNext.startsWith(`/${role}`)
      ? requestedNext
      : ROLE_HOME[role];

  return { success: "Login successful. Welcome back!", redirectTo: next };
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
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const { role, firstName, lastName, phone, email, password } = parsed.data;
  const supabase = await createClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, first_name: firstName, last_name: lastName, phone: phone || null },
      emailRedirectTo: `${siteUrl}/callback?next=${encodeURIComponent(ROLE_HOME[role])}`,
    },
  });

  if (error) {
    return { error: error.message.includes("already registered")
      ? "An account with that email already exists."
      : "We couldn't create your account. Please try again." };
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
  redirect("/login?success=You%20have%20been%20signed%20out%20successfully.");
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SUBTEXT, TEXT_LINK } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

/**
 * Opened from the emailed link: `/callback` has already turned the link's
 * code into a session. Without a session there is nothing to reset.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?notice=invalid_link");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Use at least 8 characters. You&apos;ll sign in again afterwards.</CardDescription>
      </CardHeader>

      <ResetPasswordForm />

      <p className={cn(SUBTEXT, "mt-6 text-center")}>
        <Link href="/login" className={TEXT_LINK}>
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}

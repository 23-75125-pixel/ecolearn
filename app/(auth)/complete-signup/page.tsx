import { redirect } from "next/navigation";
import { CompleteSignupForm } from "@/components/auth/complete-signup-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants/roles";

/** Shown once to accounts that have not accepted the Terms yet (e.g. first Google sign-in). */
export default async function CompleteSignupPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.termsAccepted) redirect(ROLE_HOME[profile.role]);

  // Admins keep their role; only students and tutors choose one here.
  const defaultRole = profile.role === "admin" ? null : profile.role;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile.first_name ? `Welcome, ${profile.first_name}` : "Welcome to ECoLearn"}</CardTitle>
        <CardDescription>One last step before you get started.</CardDescription>
      </CardHeader>

      <CompleteSignupForm defaultRole={defaultRole} />
    </Card>
  );
}

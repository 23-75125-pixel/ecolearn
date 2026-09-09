import { createClient } from "@/lib/supabase/server";
import { TutorDirectory } from "@/components/tutors/tutor-directory";

export default async function TutorsPage() {
  const supabase = await createClient();

  // RLS: tutor_profiles_select_public only returns rows where is_active is
  // true (or the caller owns the row / is an admin) — no need to repeat
  // that filter here, but it's kept explicit for readability.
  const { data: tutors } = await supabase
    .from("tutor_profiles")
    .select(
      "id, headline, bio, profiles(first_name, last_name), tutor_subjects(subjects(name))",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Find a tutor</h1>
      <p className="mt-1 text-sm text-muted">
        Every tutor listed here has been reviewed and approved by an ECoLearn administrator.
      </p>

      <TutorDirectory tutors={tutors ?? []} />
    </div>
  );
}

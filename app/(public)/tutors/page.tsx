import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

      {!tutors || tutors.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          No approved tutors yet — check back soon.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor) => {
            const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
            const subjects = (tutor.tutor_subjects ?? [])
              .map((ts) => (Array.isArray(ts.subjects) ? ts.subjects[0]?.name : ts.subjects?.name))
              .filter(Boolean);

            return (
              <Link key={tutor.id} href={`/tutors/${tutor.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700"
                    >
                      {profile?.first_name?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <Badge tone="success">Verified tutor</Badge>
                    </div>
                  </div>
                  {tutor.headline && (
                    <p className="mt-3 text-sm font-medium text-foreground">{tutor.headline}</p>
                  )}
                  {tutor.bio && <p className="mt-1 line-clamp-2 text-sm text-muted">{tutor.bio}</p>}
                  {subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {subjects.map((name) => (
                        <Badge key={name} tone="info">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

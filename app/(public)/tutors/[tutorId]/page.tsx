import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;
  const supabase = await createClient();

  const { data: tutor } = await supabase
    .from("tutor_profiles")
    .select(
      "id, headline, bio, profiles(first_name, last_name), tutor_subjects(subjects(name))",
    )
    .eq("id", tutorId)
    .eq("is_active", true)
    .maybeSingle();

  if (!tutor) notFound();

  const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
  const subjects = (tutor.tutor_subjects ?? [])
    .map((ts) => (Array.isArray(ts.subjects) ? ts.subjects[0]?.name : ts.subjects?.name))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-700"
        >
          {profile?.first_name?.[0] ?? "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {profile?.first_name} {profile?.last_name}
          </h1>
          <Badge tone="success">Verified tutor</Badge>
        </div>
      </div>

      {tutor.headline && (
        <p className="mt-6 text-lg font-medium text-foreground">{tutor.headline}</p>
      )}
      {tutor.bio && <p className="mt-2 text-muted">{tutor.bio}</p>}

      {subjects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {subjects.map((name) => (
            <Badge key={name} tone="info">
              {name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-dashed border-border p-6 text-sm text-muted">
        Availability and booking are coming in the next development phase.
      </div>
    </div>
  );
}

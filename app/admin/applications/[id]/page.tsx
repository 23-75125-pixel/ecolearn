import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/admin/review-actions";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "@/lib/constants/status";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("tutor_applications")
    .select(
      "id, status, school_name, degree, major, graduation_year, teaching_experience_summary, years_experience, teaching_approach, preferred_modes, submitted_at, review_notes, profiles(first_name, last_name, email, phone), tutor_application_subjects(subjects(name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!application) notFound();

  const applicant = Array.isArray(application.profiles)
    ? application.profiles[0]
    : application.profiles;
  const subjects = (application.tutor_application_subjects ?? [])
    .map((s) => (Array.isArray(s.subjects) ? s.subjects[0]?.name : s.subjects?.name))
    .filter(Boolean);

  const { data: credentials } = await supabase
    .from("tutor_credentials")
    .select("id, credential_type, file_name, storage_path")
    .eq("application_id", id);

  const credentialsWithUrls = await Promise.all(
    (credentials ?? []).map(async (c) => {
      const { data: signed } = await supabase.storage
        .from("tutor-credentials")
        .createSignedUrl(c.storage_path, 60 * 10);
      return { ...c, url: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {applicant?.first_name} {applicant?.last_name}
        </h1>
        <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </div>
      <p className="text-sm text-muted">
        {applicant?.email}
        {applicant?.phone ? ` · ${applicant.phone}` : ""}
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Academic background</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">School</dt>
            <dd className="text-foreground">{application.school_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Degree</dt>
            <dd className="text-foreground">{application.degree || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Major</dt>
            <dd className="text-foreground">{application.major || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Graduation year</dt>
            <dd className="text-foreground">{application.graduation_year || "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Teaching experience</CardTitle>
        </CardHeader>
        <p className="text-sm text-foreground">{application.teaching_experience_summary || "—"}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Years of experience</dt>
            <dd className="text-foreground">{application.years_experience ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Preferred modes</dt>
            <dd className="text-foreground">{application.preferred_modes?.join(", ") || "—"}</dd>
          </div>
        </dl>
        {application.teaching_approach && (
          <p className="mt-4 text-sm text-muted">{application.teaching_approach}</p>
        )}
        {subjects.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {subjects.map((name) => (
              <Badge key={name} tone="info">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Uploaded credentials</CardTitle>
        </CardHeader>
        {credentialsWithUrls.length === 0 ? (
          <p className="text-sm text-muted">No documents uploaded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {credentialsWithUrls.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span className="text-foreground">
                  {c.file_name} <span className="text-muted">({c.credential_type})</span>
                </span>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {["pending", "under_review", "needs_revision"].includes(application.status) && (
        <div className="mt-6">
          <ReviewActions applicationId={application.id} />
        </div>
      )}
    </div>
  );
}

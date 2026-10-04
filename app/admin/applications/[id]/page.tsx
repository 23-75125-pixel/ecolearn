import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { ReviewActions } from "@/components/admin/review-actions";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  REVIEWABLE_APPLICATION_STATUSES,
} from "@/lib/constants/status";

import { ExternalLink } from "lucide-react";
import { DIVIDE, ICON, ITEM_TITLE, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { uuidSchema } from "@/lib/validations/common";

const CREDENTIAL_LINK_EXPIRY_SECONDS = 60 * 10;

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from("tutor_applications")
    .select(
      "id, tutor_id, status, school_name, degree, major, graduation_year, teaching_experience_summary, years_experience, teaching_approach, preferred_modes, submitted_at, review_notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (applicationError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Alert>Unable to load this application for review. Please check the Supabase policies and try again.</Alert>
      </div>
    );
  }
  if (!application) notFound();

  const [{ data: applicant }, { data: contactRows }, { data: applicationSubjects }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", application.tutor_id).maybeSingle(),
    supabase.rpc("get_private_profile", { p_profile_id: application.tutor_id }),
    supabase.from("tutor_application_subjects").select("subject_id").eq("application_id", id),
  ]);
  const contact = contactRows?.[0];
  const subjectIds = (applicationSubjects ?? []).map((subject) => subject.subject_id);
  const { data: subjectsData } = subjectIds.length > 0
    ? await supabase.from("subjects").select("name").in("id", subjectIds)
    : { data: [] };
  const subjects = (subjectsData ?? []).map((subject) => subject.name);

  const { data: credentials } = await supabase
    .from("tutor_credentials")
    .select("id, credential_type, file_name, storage_path")
    .eq("application_id", id);

  const credentialsWithUrls = await Promise.all(
    (credentials ?? []).map(async (c) => {
      const { data: signed } = await supabase.storage
        .from("tutor-credentials")
        .createSignedUrl(c.storage_path, CREDENTIAL_LINK_EXPIRY_SECONDS);
      return { ...c, url: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className={TITLE}>
          {applicant?.first_name} {applicant?.last_name}
        </h1>
        <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </div>
      <p className={cn(SUBTEXT, "mt-1")}>
        {contact?.email}
        {contact?.phone ? ` · ${contact.phone}` : ""}
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Academic background</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className={SUBTEXT}>School</dt>
            <dd className="mt-0.5">{application.school_name || "—"}</dd>
          </div>
          <div>
            <dt className={SUBTEXT}>Degree</dt>
            <dd className="mt-0.5">{application.degree || "—"}</dd>
          </div>
          <div>
            <dt className={SUBTEXT}>Major</dt>
            <dd className="mt-0.5">{application.major || "—"}</dd>
          </div>
          <div>
            <dt className={SUBTEXT}>Graduation year</dt>
            <dd className="mt-0.5">{application.graduation_year || "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Teaching experience</CardTitle>
        </CardHeader>
        <p className="text-sm leading-6">{application.teaching_experience_summary || "—"}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className={SUBTEXT}>Years of experience</dt>
            <dd className="mt-0.5">{application.years_experience ?? "—"}</dd>
          </div>
          <div>
            <dt className={SUBTEXT}>Preferred modes</dt>
            <dd className="mt-0.5">{application.preferred_modes?.join(", ") || "—"}</dd>
          </div>
        </dl>
        {application.teaching_approach && (
          <p className={cn(SUBTEXT, "mt-4 leading-6")}>{application.teaching_approach}</p>
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
          <p className={SUBTEXT}>No documents uploaded.</p>
        ) : (
          <ul className={DIVIDE}>
            {credentialsWithUrls.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className={ITEM_TITLE}>
                  {c.file_name} <span className={cn(SUBTEXT, "font-normal")}>({c.credential_type})</span>
                </span>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                  >
                    View
                    <ExternalLink className={ICON} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {REVIEWABLE_APPLICATION_STATUSES.includes(application.status) && (
        <div className="mt-6">
          <ReviewActions applicationId={application.id} />
        </div>
      )}
    </div>
  );
}

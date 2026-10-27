"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { saveTutorApplication, type TutorFormState } from "@/app/tutor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Label, FieldError } from "@/components/ui/label";
import { ActionDialog } from "@/components/ui/action-dialog";
import { parseApplicationForm, type ApplicationErrors } from "@/lib/validations/application";
import { BORDER, BORDER_COLOR, ITEM_TITLE, SUBTEXT, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

type Subject = { id: string; name: string };
type Application = {
  id: string;
  school_name: string | null;
  degree: string | null;
  major: string | null;
  graduation_year: number | null;
  academic_achievements: string | null;
  teaching_experience_summary: string | null;
  years_experience: number | null;
  teaching_approach: string | null;
  preferred_modes: string[];
  tutor_application_subjects: { subject_id: string }[];
  tutor_credentials: { id: string }[];
};

const CHECKBOX = "h-4 w-4 accent-brand-600";
const TEACHING_MODE_OPTIONS = [
  ["online", "Online"],
  ["in_person", "In person"],
  ["hybrid", "Hybrid"],
] as const;
const CREDENTIAL_TYPE_OPTIONS = [
  ["valid_id", "Valid ID"],
  ["diploma", "Diploma"],
  ["certificate", "Certificate"],
  ["teaching_credential", "Teaching credential"],
  ["other", "Other"],
] as const;

/** Field names in the order they appear on the page — the first invalid one gets the focus. */
const FIELD_ORDER = [
  "schoolName",
  "degree",
  "major",
  "graduationYear",
  "academicAchievements",
  "subjectIds",
  "experience",
  "yearsExperience",
  "teachingApproach",
  "preferredModes",
  "credentialType",
  "credential",
];

/** A label with a * for required fields. */
function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: string }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && (
        <span className="text-zinc-500 dark:text-zinc-400" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </Label>
  );
}

export function ApplicationForm({ application, subjects }: { application?: Application; subjects: Subject[] }) {
  const [state, formAction, pending] = useActionState(saveTutorApplication, null as TutorFormState);
  const [clientErrors, setClientErrors] = useState<ApplicationErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedSubjects = new Set(application?.tutor_application_subjects.map((item) => item.subject_id));
  const hasCredential = (application?.tutor_credentials.length ?? 0) > 0;
  const errors = clientErrors ?? state?.fieldErrors ?? {};
  const hasErrors = Object.keys(errors).length > 0;

  /**
   * Checks every field with the same rules the server uses. Nothing is sent
   * (and nothing the tutor typed is cleared) until the form is valid.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const result = parseApplicationForm(formData, { hasCredential });
    if ("errors" in result) {
      setClientErrors(result.errors);
      const firstInvalid = FIELD_ORDER.find((field) => result.errors[field]);
      const target = formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
      target?.focus();
      return;
    }

    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return (
    <div className={cn("mt-6 border-t pt-6", BORDER_COLOR)}>
      <div className="mb-6">
        <h3 className={ITEM_TITLE}>{application ? "Update your application" : "Tutor application"}</h3>
        <p className={cn(SUBTEXT, "mt-1")}>
          Share your background so students can learn with confidence. Fields marked * are required.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-8">
        {state?.error && <Alert>{state.error}</Alert>}
        {hasErrors && <Alert>Please fix the highlighted fields and submit again.</Alert>}

        <fieldset className="space-y-4">
          <legend className={cn("mb-3", ITEM_TITLE)}>Academic background</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="schoolName" required>School</FieldLabel>
              <Input id="schoolName" name="schoolName" maxLength={200} placeholder="Batangas State University" defaultValue={application?.school_name ?? ""} invalid={!!errors.schoolName} />
              <FieldError>{errors.schoolName}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor="degree" required>Degree</FieldLabel>
              <Input id="degree" name="degree" maxLength={200} placeholder="Bachelor of Science in Information Technology" defaultValue={application?.degree ?? ""} invalid={!!errors.degree} />
              <FieldError>{errors.degree}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor="major" required>Major</FieldLabel>
              <Input id="major" name="major" maxLength={200} placeholder="Web Development" defaultValue={application?.major ?? ""} invalid={!!errors.major} />
              <FieldError>{errors.major}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor="graduationYear" required>Graduation year</FieldLabel>
              <Input id="graduationYear" name="graduationYear" type="number" inputMode="numeric" min={1950} max={new Date().getFullYear() + 1} placeholder="2026" defaultValue={application?.graduation_year ?? ""} invalid={!!errors.graduationYear} />
              <FieldError>{errors.graduationYear}</FieldError>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="academicAchievements">Academic achievements (optional)</FieldLabel>
            <Textarea id="academicAchievements" name="academicAchievements" rows={3} maxLength={2000} placeholder="Dean's lister, programming contest finalist..." defaultValue={application?.academic_achievements ?? ""} invalid={!!errors.academicAchievements} />
            <FieldError>{errors.academicAchievements}</FieldError>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className={cn("mb-3", ITEM_TITLE)}>Subjects and teaching</legend>
          <div>
            <span className={cn("mb-2 block", ITEM_TITLE)}>
              Subjects{" "}
              <span className="text-zinc-500 dark:text-zinc-400" aria-hidden="true">*</span>
            </span>
            {subjects.length === 0 ? (
              <Alert role="status">No subjects are available. Please ask an administrator to add subjects first.</Alert>
            ) : (
              <div className={cn("grid gap-2 rounded-md p-3 sm:grid-cols-2", BORDER, SURFACE)}>
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" name="subjectIds" value={subject.id} defaultChecked={selectedSubjects.has(subject.id)} className={CHECKBOX} />
                    {subject.name}
                  </label>
                ))}
              </div>
            )}
            <FieldError>{errors.subjectIds}</FieldError>
          </div>

          <div>
            <FieldLabel htmlFor="experience" required>Teaching experience</FieldLabel>
            <Textarea id="experience" name="experience" rows={3} maxLength={2000} placeholder="Describe where and how you have tutored or taught before." defaultValue={application?.teaching_experience_summary ?? ""} invalid={!!errors.experience} />
            <FieldError>{errors.experience}</FieldError>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="yearsExperience" required>Years of experience</FieldLabel>
              <Input id="yearsExperience" name="yearsExperience" type="number" inputMode="numeric" min={0} max={80} placeholder="2" defaultValue={application?.years_experience ?? ""} invalid={!!errors.yearsExperience} />
              <FieldError>{errors.yearsExperience}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor="teachingApproach" required>Teaching approach</FieldLabel>
              <Input id="teachingApproach" name="teachingApproach" maxLength={500} placeholder="Practice-first, with short quizzes" defaultValue={application?.teaching_approach ?? ""} invalid={!!errors.teachingApproach} />
              <FieldError>{errors.teachingApproach}</FieldError>
            </div>
          </div>

          <div>
            <span className={cn("mb-2 block", ITEM_TITLE)}>
              Teaching modes{" "}
              <span className="text-zinc-500 dark:text-zinc-400" aria-hidden="true">*</span>
            </span>
            <div className="flex flex-wrap gap-4 text-sm">
              {TEACHING_MODE_OPTIONS.map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input type="checkbox" name="preferredModes" value={value} defaultChecked={application?.preferred_modes.includes(value)} className={CHECKBOX} />
                  {label}
                </label>
              ))}
            </div>
            <FieldError>{errors.preferredModes}</FieldError>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className={cn("mb-3", ITEM_TITLE)}>Credential</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="credentialType" required>Document type</FieldLabel>
              <Select id="credentialType" name="credentialType" defaultValue="valid_id" invalid={!!errors.credentialType}>
                {CREDENTIAL_TYPE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <FieldError>{errors.credentialType}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor="credential" required={!hasCredential}>Upload document</FieldLabel>
              <Input id="credential" name="credential" type="file" accept=".pdf,.jpg,.jpeg,.png" invalid={!!errors.credential} />
              <FieldError>{errors.credential}</FieldError>
            </div>
          </div>
          <p className={SUBTEXT}>
            PDF, JPG, or PNG up to 5 MB.
            {hasCredential && " A document is already on file, so uploading another is optional."}
          </p>
        </fieldset>

        <Button type="submit" isLoading={pending}>
          {application ? "Submit updated application" : "Submit application"}
        </Button>
        <ActionDialog error={state?.error} success={state?.success} />
      </form>
    </div>
  );
}

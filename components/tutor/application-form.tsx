"use client";

import { useActionState } from "react";
import { saveTutorApplication, type TutorFormState } from "@/app/tutor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
};

export function ApplicationForm({ application, subjects }: { application?: Application; subjects: Subject[] }) {
  const [state, formAction, pending] = useActionState(saveTutorApplication, null as TutorFormState);
  const selected = new Set(application?.tutor_application_subjects.map((item) => item.subject_id));
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{application ? "Update your application" : "Tutor application"}</CardTitle>
        <CardDescription>Share your background so students can learn with confidence.</CardDescription>
      </CardHeader>
      <form action={formAction} className="space-y-6" encType="multipart/form-data">
        <input type="hidden" name="applicationId" value={application?.id ?? ""} />
        {state?.error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-foreground">Academic background</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="schoolName">School</Label><Input id="schoolName" name="schoolName" defaultValue={application?.school_name ?? ""} required /></div>
            <div><Label htmlFor="degree">Degree</Label><Input id="degree" name="degree" defaultValue={application?.degree ?? ""} required /></div>
            <div><Label htmlFor="major">Major</Label><Input id="major" name="major" defaultValue={application?.major ?? ""} required /></div>
            <div><Label htmlFor="graduationYear">Graduation year</Label><Input id="graduationYear" name="graduationYear" type="number" min="1950" max="2100" defaultValue={application?.graduation_year ?? ""} /></div>
          </div>
          <div><Label htmlFor="academicAchievements">Academic achievements</Label><textarea id="academicAchievements" name="academicAchievements" rows={3} defaultValue={application?.academic_achievements ?? ""} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></div>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-foreground">Subjects and teaching</legend>
          <div><span className="mb-2 block text-sm font-medium text-foreground">Subjects</span><div className="grid gap-2 sm:grid-cols-2">{subjects.map((subject) => <label key={subject.id} className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" name="subjectIds" value={subject.id} defaultChecked={selected.has(subject.id)} />{subject.name}</label>)}</div></div>
          <div><Label htmlFor="experience">Teaching experience</Label><textarea id="experience" name="experience" rows={3} required defaultValue={application?.teaching_experience_summary ?? ""} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="yearsExperience">Years of experience</Label><Input id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue={application?.years_experience ?? ""} /></div><div><Label htmlFor="teachingApproach">Teaching approach</Label><Input id="teachingApproach" name="teachingApproach" defaultValue={application?.teaching_approach ?? ""} required /></div></div>
          <div><span className="mb-2 block text-sm font-medium text-foreground">Teaching modes</span><div className="flex flex-wrap gap-4 text-sm text-foreground">{[["online", "Online"], ["in_person", "In person"], ["hybrid", "Hybrid"]].map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="checkbox" name="preferredModes" value={value} defaultChecked={application?.preferred_modes.includes(value)} />{label}</label>)}</div></div>
        </fieldset>
        <fieldset className="space-y-3"><legend className="text-base font-semibold text-foreground">Credential</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="credentialType">Document type</Label><select id="credentialType" name="credentialType" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="valid_id">Valid ID</option><option value="diploma">Diploma</option><option value="certificate">Certificate</option><option value="teaching_credential">Teaching credential</option><option value="other">Other</option></select></div><div><Label htmlFor="credential">Upload document</Label><Input id="credential" name="credential" type="file" accept=".pdf,.jpg,.jpeg,.png" /></div></div><p className="text-xs text-muted">PDF, JPG, or PNG up to 20 MB.</p></fieldset>
        <FieldError>{state?.error}</FieldError><Button type="submit" isLoading={pending}>{application ? "Submit updated application" : "Submit application"}</Button>
      </form>
    </Card>
  );
}

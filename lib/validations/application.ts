import { z } from "zod";
import { emptyToUndefined, uuidSchema } from "@/lib/validations/common";

/**
 * Validation for the tutor application form.
 *
 * The same code runs in the browser (so mistakes are shown before anything
 * is sent) and in the Server Action (so a crafted request cannot skip it).
 */

export const CREDENTIAL_TYPES = ["valid_id", "diploma", "certificate", "teaching_credential", "other"] as const;
export const TEACHING_MODES = ["online", "in_person", "hybrid"] as const;

/** Must match the `tutor-credentials` bucket limits in migration 0004. */
export const MAX_CREDENTIAL_FILE_BYTES = 5 * 1024 * 1024;
export const CREDENTIAL_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const CREDENTIAL_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

const FIRST_GRADUATION_YEAR = 1950;

/** "" -> undefined (missing), "2020" -> 2020. Form values always arrive as strings. */
function toNumber(value: unknown) {
  const present = emptyToUndefined(value);
  return present === undefined ? undefined : Number(present);
}

/** A required text field, with the label used in every message. */
function requiredText(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);
}

/** A required whole number inside a range. */
function wholeNumber(label: string, min: number, max: number) {
  return z.preprocess(
    toNumber,
    z
      .number({ error: `${label} is required.` })
      .int(`${label} must be a whole number.`)
      .min(min, `${label} must be ${min} or more.`)
      .max(max, `${label} must be ${max} or less.`),
  );
}

export const applicationSchema = z.object({
  schoolName: requiredText("School", 2, 200),
  degree: requiredText("Degree", 2, 200),
  major: requiredText("Major", 2, 200),
  graduationYear: z.preprocess(
    toNumber,
    z
      .number({ error: "Graduation year is required." })
      .int("Graduation year must be a whole number.")
      .min(FIRST_GRADUATION_YEAR, `Graduation year must be ${FIRST_GRADUATION_YEAR} or later.`)
      .refine((year) => year <= new Date().getFullYear() + 1, "Graduation year cannot be that far in the future."),
  ),
  academicAchievements: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(2000, "Academic achievements must be at most 2000 characters.").optional(),
  ),
  subjectIds: z.array(uuidSchema).min(1, "Choose at least one subject."),
  experience: requiredText("Teaching experience", 10, 2000),
  yearsExperience: wholeNumber("Years of experience", 0, 80),
  teachingApproach: requiredText("Teaching approach", 10, 500),
  preferredModes: z.array(z.enum(TEACHING_MODES)).min(1, "Choose at least one teaching mode."),
  credentialType: z.enum(CREDENTIAL_TYPES, { error: "Choose a document type." }),
});

/** Checks the uploaded file. Returns an error message, or null when it is fine. */
export function validateCredentialFile(file: File | null, { required }: { required: boolean }): string | null {
  if (!file || file.size === 0) return required ? "Upload a credential document." : null;

  const name = file.name.toLowerCase();
  if (!CREDENTIAL_FILE_TYPES[file.type] || !CREDENTIAL_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Upload a PDF, JPG, or PNG file.";
  }
  if (file.size > MAX_CREDENTIAL_FILE_BYTES) return "The file must be 5 MB or smaller.";
  return null;
}

/** The first bytes of each allowed file type. Stops a renamed .exe from passing as a PDF. */
const FILE_SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
};

export async function hasValidFileSignature(file: File): Promise<boolean> {
  const expected = FILE_SIGNATURES[file.type];
  if (!expected) return false;
  const start = new Uint8Array(await file.slice(0, expected.length).arrayBuffer());
  return expected.every((byte, index) => start[index] === byte);
}

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationErrors = Record<string, string>;

/**
 * Reads the whole application form and validates every field.
 * Returns the clean data, or one message per invalid field (keyed by field name).
 */
export function parseApplicationForm(
  formData: FormData,
  { hasCredential }: { hasCredential: boolean },
): { data: ApplicationInput; file: File | null } | { errors: ApplicationErrors } {
  const parsed = applicationSchema.safeParse({
    schoolName: formData.get("schoolName"),
    degree: formData.get("degree"),
    major: formData.get("major"),
    graduationYear: formData.get("graduationYear"),
    academicAchievements: formData.get("academicAchievements"),
    subjectIds: formData.getAll("subjectIds"),
    experience: formData.get("experience"),
    yearsExperience: formData.get("yearsExperience"),
    teachingApproach: formData.get("teachingApproach"),
    preferredModes: formData.getAll("preferredModes"),
    credentialType: formData.get("credentialType"),
  });

  const errors: ApplicationErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!errors[field]) errors[field] = issue.message;
    }
  }

  const entry = formData.get("credential");
  const file = entry instanceof File && entry.size > 0 ? entry : null;
  const fileError = validateCredentialFile(file, { required: !hasCredential });
  if (fileError) errors.credential = fileError;

  if (Object.keys(errors).length > 0 || !parsed.success) return { errors };
  return { data: parsed.data, file };
}

import { describe, expect, it } from "vitest";
import {
  completeSignupSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { parseUuid } from "@/lib/validations/common";
import { hasValidFileSignature, parseApplicationForm } from "@/lib/validations/application";
import { availabilitySchema } from "@/lib/validations/tutor";

const validRegistration = {
  role: "student",
  firstName: "Ana",
  lastName: "Cruz",
  phone: "",
  email: "ana@example.com",
  password: "longenough1",
  confirmPassword: "longenough1",
  acceptTerms: "yes",
};

describe("registerSchema", () => {
  it("accepts a valid student", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("never lets a user register as admin", () => {
    expect(registerSchema.safeParse({ ...validRegistration, role: "admin" }).success).toBe(false);
  });

  it("requires the terms checkbox to be ticked", () => {
    const withoutTerms: Partial<typeof validRegistration> = { ...validRegistration };
    delete withoutTerms.acceptTerms;
    const missing = registerSchema.safeParse(withoutTerms);
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0].path).toEqual(["acceptTerms"]);

    expect(registerSchema.safeParse({ ...validRegistration, acceptTerms: "no" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, acceptTerms: null }).success).toBe(false);
  });

  it("rejects mismatched passwords and bad phone numbers", () => {
    expect(registerSchema.safeParse({ ...validRegistration, confirmPassword: "different" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, phone: "<script>" }).success).toBe(false);
  });
});

describe("parseApplicationForm", () => {
  const thisYear = new Date().getFullYear();
  const validFields: Record<string, string | string[]> = {
    schoolName: "BatStateU",
    degree: "BSIT",
    major: "Programming",
    graduationYear: String(thisYear),
    academicAchievements: "",
    subjectIds: ["3f2504e0-4f89-41d3-9a0c-0305e82c3301"],
    experience: "Two years of tutoring classmates",
    yearsExperience: "2",
    teachingApproach: "Practice first, then review",
    preferredModes: ["online"],
    credentialType: "diploma",
  };
  const pdf = () => new File(["%PDF-1.4"], "diploma.pdf", { type: "application/pdf" });

  /** Builds a FormData from the valid fields, with some fields replaced. */
  function buildForm(overrides: Record<string, string | string[] | File | null> = {}) {
    const form = new FormData();
    for (const [key, value] of Object.entries({ credential: pdf(), ...validFields, ...overrides })) {
      if (value === null) continue;
      for (const item of Array.isArray(value) ? value : [value]) form.append(key, item);
    }
    return form;
  }

  const errorsFor = (overrides: Record<string, string | string[] | File | null>, hasCredential = false) => {
    const result = parseApplicationForm(buildForm(overrides), { hasCredential });
    return "errors" in result ? result.errors : {};
  };

  it("accepts a complete form", () => {
    expect("data" in parseApplicationForm(buildForm(), { hasCredential: false })).toBe(true);
  });

  it("requires the text fields and rejects whitespace-only values", () => {
    for (const field of ["schoolName", "degree", "major", "experience", "teachingApproach"]) {
      expect(errorsFor({ [field]: "   " })[field], field).toMatch(/is required/);
    }
  });

  it("enforces minimum and maximum lengths", () => {
    expect(errorsFor({ schoolName: "A" }).schoolName).toMatch(/at least 2/);
    expect(errorsFor({ experience: "too short" }).experience).toMatch(/at least 10/);
    expect(errorsFor({ teachingApproach: "x".repeat(501) }).teachingApproach).toMatch(/at most 500/);
    expect(errorsFor({ academicAchievements: "x".repeat(2001) }).academicAchievements).toMatch(/at most 2000/);
  });

  it("requires graduation year and keeps it in a sensible range", () => {
    expect(errorsFor({ graduationYear: "" }).graduationYear).toMatch(/required/);
    expect(errorsFor({ graduationYear: "1949" }).graduationYear).toMatch(/1950 or later/);
    expect(errorsFor({ graduationYear: String(thisYear + 5) }).graduationYear).toMatch(/future/);
    expect(errorsFor({ graduationYear: "2020.5" }).graduationYear).toMatch(/whole number/);
  });

  it("requires years of experience as a whole number from 0 to 80", () => {
    expect(errorsFor({ yearsExperience: "" }).yearsExperience).toMatch(/required/);
    expect(errorsFor({ yearsExperience: "-1" }).yearsExperience).toMatch(/0 or more/);
    expect(errorsFor({ yearsExperience: "81" }).yearsExperience).toMatch(/80 or less/);
    expect(errorsFor({ yearsExperience: "1.5" }).yearsExperience).toMatch(/whole number/);
    expect(errorsFor({ yearsExperience: "0" }).yearsExperience).toBeUndefined();
  });

  it("requires at least one subject, and only real UUIDs", () => {
    expect(errorsFor({ subjectIds: [] }).subjectIds).toMatch(/at least one subject/);
    expect(errorsFor({ subjectIds: ["1 OR 1=1"] }).subjectIds).toBeDefined();
  });

  it("requires a teaching mode and a known document type", () => {
    expect(errorsFor({ preferredModes: [] }).preferredModes).toMatch(/at least one teaching mode/);
    expect(errorsFor({ preferredModes: ["telepathy"] }).preferredModes).toBeDefined();
    expect(errorsFor({ credentialType: "passport" }).credentialType).toBeDefined();
  });

  it("requires a file unless one is already on file", () => {
    expect(errorsFor({ credential: null }).credential).toMatch(/Upload a credential/);
    expect(errorsFor({ credential: null }, true).credential).toBeUndefined();
  });

  it("rejects the wrong file type, a wrong extension, and files over 5 MB", () => {
    const exe = new File(["x"], "virus.exe", { type: "application/x-msdownload" });
    expect(errorsFor({ credential: exe }).credential).toMatch(/PDF, JPG, or PNG/);

    const renamed = new File(["x"], "notes.txt", { type: "application/pdf" });
    expect(errorsFor({ credential: renamed }).credential).toMatch(/PDF, JPG, or PNG/);

    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.pdf", { type: "application/pdf" });
    expect(errorsFor({ credential: huge }).credential).toMatch(/5 MB/);
  });

  it("reports every invalid field at once", () => {
    const errors = errorsFor({ schoolName: "", graduationYear: "", subjectIds: [], credential: null });
    expect(Object.keys(errors).sort()).toEqual(["credential", "graduationYear", "schoolName", "subjectIds"]);
  });
});

describe("hasValidFileSignature", () => {
  it("accepts real PDF, PNG and JPEG headers and rejects disguised files", async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d])], "a.png", { type: "image/png" });
    const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "a.jpg", { type: "image/jpeg" });
    const pdf = new File(["%PDF-1.7"], "a.pdf", { type: "application/pdf" });
    const fake = new File(["MZ\x90 not a pdf"], "a.pdf", { type: "application/pdf" });
    expect(await hasValidFileSignature(png)).toBe(true);
    expect(await hasValidFileSignature(jpg)).toBe(true);
    expect(await hasValidFileSignature(pdf)).toBe(true);
    expect(await hasValidFileSignature(fake)).toBe(false);
  });
});

describe("availabilitySchema", () => {
  const valid = { dayDate: "2026-10-05", startTime: "09:00", endTime: "12:00", duration: "60", subjectId: "" };

  it("accepts a normal window", () => {
    expect(availabilitySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an end time before the start time and odd durations", () => {
    expect(availabilitySchema.safeParse({ ...valid, endTime: "08:00" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...valid, duration: "7" }).success).toBe(false);
  });
});

describe("parseUuid", () => {
  it("returns only valid UUIDs", () => {
    const form = new FormData();
    form.set("good", "3f2504e0-4f89-41d3-9a0c-0305e82c3301");
    form.set("bad", "1 OR 1=1");
    expect(parseUuid(form, "good")).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
    expect(parseUuid(form, "bad")).toBeNull();
    expect(parseUuid(form, "missing")).toBeNull();
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts an email and rejects anything else", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ana@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("uses the same password rules as registration", () => {
    expect(resetPasswordSchema.safeParse({ password: "longenough1", confirmPassword: "longenough1" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "longenough1", confirmPassword: "different1" }).success).toBe(false);
  });
});

describe("completeSignupSchema", () => {
  it("needs the checkbox, and only allows student or tutor roles", () => {
    expect(completeSignupSchema.safeParse({ acceptTerms: "yes" }).success).toBe(true);
    expect(completeSignupSchema.safeParse({ acceptTerms: "yes", role: "tutor" }).success).toBe(true);
    expect(completeSignupSchema.safeParse({ role: "student" }).success).toBe(false);
    expect(completeSignupSchema.safeParse({ acceptTerms: "yes", role: "admin" }).success).toBe(false);
  });
});

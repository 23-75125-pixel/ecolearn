import { z } from "zod";

const emailSchema = z.email("Enter a valid email address.");

/** One password rule for registration and for resetting a password. */
const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

/** The value of the checked "I agree" checkbox. */
const acceptTermsSchema = z.literal("yes", {
  error: "You must accept the Terms of Service and Privacy Policy to continue.",
});

const roleSchema = z.enum(["student", "tutor"], {
  error: "Choose whether you're joining as a student or a tutor.",
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    role: roleSchema,
    firstName: z.string().trim().min(1, "First name is required.").max(100),
    lastName: z.string().trim().min(1, "Last name is required.").max(100),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+()\-\s]{0,30}$/, "Phone number may only contain digits, spaces, + ( ) and -.")
      .optional(),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
    acceptTerms: acceptTermsSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** Second step for accounts created with Google. `role` is absent for admins. */
export const completeSignupSchema = z.object({
  role: roleSchema.optional(),
  acceptTerms: acceptTermsSchema,
});

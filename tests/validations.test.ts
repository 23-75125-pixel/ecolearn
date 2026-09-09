import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("authentication validation", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "learner@example.com", password: "secret" }).success).toBe(true);
  });

  it("rejects malformed email and empty password", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "" });
    expect(result.success).toBe(false);
  });

  it("requires matching registration passwords", () => {
    const result = registerSchema.safeParse({
      role: "student",
      firstName: "Ana",
      lastName: "Reyes",
      phone: "",
      email: "ana@example.com",
      password: "password123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toContain("confirmPassword");
  });

  it("accepts a tutor registration with optional phone omitted", () => {
    expect(registerSchema.safeParse({
      role: "tutor",
      firstName: "Mika",
      lastName: "Santos",
      email: "mika@example.com",
      password: "password123",
      confirmPassword: "password123",
    }).success).toBe(true);
  });
});
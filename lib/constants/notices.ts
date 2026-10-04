/**
 * Fixed messages for the login page. The URL carries only a short code
 * (`/login?notice=signed_out`), never display text, so nobody can craft a
 * link that shows an arbitrary message on our domain.
 */
export const LOGIN_NOTICES = {
  signed_out: { type: "success", message: "You have been signed out successfully." },
  password_updated: { type: "success", message: "Your password was updated. Sign in with your new password." },
  invalid_link: { type: "error", message: "That link is invalid or has expired. Please request a new one." },
  sign_in_failed: { type: "error", message: "We couldn't complete sign-in. Please try again." },
} as const;

export type LoginNoticeCode = keyof typeof LOGIN_NOTICES;

export function isLoginNoticeCode(value: string | null): value is LoginNoticeCode {
  return value !== null && value in LOGIN_NOTICES;
}

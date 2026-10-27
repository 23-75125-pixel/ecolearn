import Link from "next/link";
import { FieldError } from "@/components/ui/label";
import { TEXT_LINK } from "@/lib/ui/styles";

/** "I agree to the Terms and Privacy Policy" — the links open in a new tab so the form is not lost. */
export function TermsCheckbox({ error }: { error?: string }) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          value="yes"
          aria-invalid={error ? true : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
        />
        <label htmlFor="acceptTerms" className="cursor-pointer text-sm leading-5">
          I have read and agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
            Privacy Policy
          </Link>
          .
        </label>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

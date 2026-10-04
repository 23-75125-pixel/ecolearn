import { BookOpenCheck, GraduationCap } from "lucide-react";
import { FieldError } from "@/components/ui/label";
import { BORDER_COLOR, ICON_INLINE, INTERACTIVE, ITEM_TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

export type SignupRole = "student" | "tutor";

type RoleSelectorProps = {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  error?: string;
};

/** "I'm joining as a..." radio cards, shared by the register and complete-signup forms. */
export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <fieldset>
      <legend className={cn("mb-1.5 block", ITEM_TITLE)}>I&apos;m joining as a...</legend>
      <div className="grid grid-cols-2 gap-2">
        {(["student", "tutor"] as const).map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium capitalize",
              INTERACTIVE,
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-400",
              value === option
                ? "border-brand-600 bg-zinc-100/50 text-brand-600 dark:border-brand-400 dark:bg-zinc-900/50 dark:text-brand-400"
                : cn(BORDER_COLOR, "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"),
            )}
          >
            <input
              type="radio"
              name="role"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {option === "student" ? (
              <BookOpenCheck aria-hidden="true" className={ICON_INLINE} />
            ) : (
              <GraduationCap aria-hidden="true" className={ICON_INLINE} />
            )}
            {option}
          </label>
        ))}
      </div>
      <FieldError>{error}</FieldError>
    </fieldset>
  );
}

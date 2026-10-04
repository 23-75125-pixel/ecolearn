"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { ICON } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const TOGGLE = buttonClasses({ variant: "ghost", size: "icon", className: "absolute right-0.5 top-0.5" });

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  /** Text for the show/hide button, e.g. "password" -> "Show password". */
  toggleName?: string;
};

/** A labelled password input with a show/hide button and its error message. */
export function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  error,
  toggleName = "password",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const action = `${visible ? "Hide" : "Show"} ${toggleName}`;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <LockKeyhole aria-hidden="true" className={cn(ICON, "pointer-events-none absolute left-3 top-3")} />
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          invalid={!!error}
          className="pl-10 pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className={TOGGLE}
          aria-label={action}
          title={action}
        >
          {visible ? <EyeOff className={ICON} /> : <Eye className={ICON} />}
        </button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ICON, fieldClasses } from "@/lib/ui/styles";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            fieldClasses(invalid),
            "h-10 appearance-none pr-9",
            "[&_option]:bg-zinc-50 [&_option]:text-zinc-900 dark:[&_option]:bg-zinc-950 dark:[&_option]:text-zinc-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className={cn(ICON, "pointer-events-none absolute right-3 top-3")} />
      </div>
    );
  },
);
Select.displayName = "Select";

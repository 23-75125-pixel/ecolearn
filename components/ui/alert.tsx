import { type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BORDER, ICON, SURFACE } from "@/lib/ui/styles";

/** Inline notice for form-level and page-level messages. Monochrome; the icon carries the signal. */
export function Alert({
  children,
  role = "alert",
  className,
}: {
  children: ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  return (
    <div role={role} className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-sm", BORDER, SURFACE, className)}>
      <CircleAlert aria-hidden="true" className={cn(ICON, "mt-0.5")} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

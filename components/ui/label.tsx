import { type LabelHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ICON, ITEM_TITLE } from "@/lib/ui/styles";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block", ITEM_TITLE, className)} {...props} />;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
      <CircleAlert aria-hidden="true" className={ICON} />
      {children}
    </p>
  );
}

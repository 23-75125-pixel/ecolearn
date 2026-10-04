import { type HTMLAttributes } from "react";
import { Check, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BORDER, ICON_BADGE, SURFACE } from "@/lib/ui/styles";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Monochrome only: tones are told apart by weight, surface, and a leading
 * icon — never by hue — so status is never colour-only.
 */
const TONES: Record<Tone, { className: string; icon?: LucideIcon }> = {
  neutral: { className: "text-zinc-500 dark:text-zinc-400" },
  info: { className: cn(SURFACE, "text-zinc-900 dark:text-zinc-50") },
  success: { className: "text-zinc-900 dark:text-zinc-50", icon: Check },
  warning: { className: "text-zinc-900 dark:text-zinc-50", icon: TriangleAlert },
  danger: { className: "text-zinc-900 dark:text-zinc-50", icon: CircleX },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", children, ...props }: BadgeProps) {
  const { className: toneClass, icon: Icon } = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        BORDER,
        toneClass,
        className,
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className={ICON_BADGE} />}
      {children}
    </span>
  );
}

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BORDER_COLOR, ICON_INLINE, INTERACTIVE } from "@/lib/ui/styles";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const BASE = cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
  "disabled:pointer-events-none disabled:opacity-50",
  INTERACTIVE,
);

const SECONDARY = `border ${BORDER_COLOR} bg-transparent hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50`;

/**
 * The palette is strictly monochrome, so "danger" and "outline" resolve to the
 * secondary treatment; destructive intent is carried by the label and icon.
 */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "border border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500",
  secondary: SECONDARY,
  outline: SECONDARY,
  ghost: "border border-transparent bg-transparent hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50",
  danger: SECONDARY,
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-11 px-6",
  icon: "h-9 w-9",
};

/** Use on <Link>/<a>/<span> so non-<button> elements share the exact same rules. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={buttonClasses({ variant, size, className })}
        {...props}
      >
        {isLoading && <LoaderCircle aria-hidden="true" className={cn(ICON_INLINE, "animate-spin")} />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

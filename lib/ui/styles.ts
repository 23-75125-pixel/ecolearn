/**
 * Single source of truth for the design system (monochrome zinc + one green brand accent).
 *
 * Every interactive element in the app composes these constants so the
 * transition, hover, and focus rules can never drift between components.
 * All values are complete Tailwind class strings, so Tailwind's scanner picks
 * them up from this file.
 */

/* ---- Interaction: identical on every clickable element ---- */
const TRANSITION = "transition-all duration-200 ease-in-out";
const HOVER = "hover:scale-[1.01] hover:opacity-90";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
export const INTERACTIVE = `${TRANSITION} ${HOVER} ${FOCUS}`;

/* ---- Borders & surfaces (clear and consistent: one color, 1px, rounded-md everywhere) ---- */
export const BORDER_COLOR = "border-zinc-300 dark:border-zinc-700";
export const BORDER = `border ${BORDER_COLOR}`;
export const SURFACE = "bg-zinc-100/50 dark:bg-zinc-900/50";
export const DIVIDE = "divide-y divide-zinc-300 dark:divide-zinc-700";

/* ---- Typography ---- */
export const TITLE = "text-3xl font-semibold tracking-tighter";
export const SECTION = "text-xl font-medium";
export const ITEM_TITLE = "text-sm font-medium";
export const SUBTEXT = "text-sm text-zinc-500 dark:text-zinc-400";

/* ---- Icons (lucide-react only) ---- */
/** Default for icons in lists, inputs, and cards. */
export const ICON = "w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400 stroke-[1.75]";
/** For icons inside buttons / active links, where the colour must be inherited. */
export const ICON_INLINE = "w-4 h-4 shrink-0 stroke-[1.75]";
/** Inside text-xs badges only (not an interactive element). */
export const ICON_BADGE = "w-3 h-3 shrink-0 stroke-[1.75]";

/* ---- Accent: brand green (primary CTAs + active states only) ---- */
const ACCENT_TEXT = "text-brand-600 dark:text-brand-400";
export const ACTIVE = `bg-zinc-100/50 dark:bg-zinc-900/50 ${ACCENT_TEXT}`;

/* ---- Form fields ---- */
const FIELD_BASE = `w-full rounded-md border bg-transparent hover:border-zinc-400 dark:hover:border-zinc-500 px-3 text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 ${TRANSITION} ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`;
const FIELD_INVALID = "border-zinc-900 dark:border-zinc-50";

export function fieldClasses(invalid?: boolean) {
  return `${FIELD_BASE} ${invalid ? FIELD_INVALID : BORDER_COLOR}`;
}

/* ---- Empty states ---- */
export const EMPTY_STATE = `rounded-md border border-dashed ${BORDER_COLOR} p-8 text-center ${SUBTEXT}`;

/* ---- Text links inside sentences ---- */
export const TEXT_LINK = `inline-block rounded-md font-medium ${ACCENT_TEXT} ${INTERACTIVE}`;

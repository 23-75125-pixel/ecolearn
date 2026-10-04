import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ICON_INLINE, INTERACTIVE } from "@/lib/ui/styles";

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-md", INTERACTIVE)}
      aria-label="Eco Learn home"
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white dark:bg-brand-500"
      >
        <Leaf className={ICON_INLINE} />
      </span>
      <span className="text-sm font-semibold">
        Eco <span className="font-medium text-zinc-500 dark:text-zinc-400">Learn</span>
      </span>
    </Link>
  );
}

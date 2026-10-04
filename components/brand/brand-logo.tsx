import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { INTERACTIVE } from "@/lib/ui/styles";

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-md", INTERACTIVE)}
      aria-label="Eco Learn home"
    >
      <Image
        src="/icon.png"
        alt=""
        width={28}
        height={28}
        quality={90}
        className="h-7 w-7 rounded-md"
        priority
      />
      <span className="text-sm font-semibold">
        Eco <span className="font-medium text-zinc-500 dark:text-zinc-400">Learn</span>
      </span>
    </Link>
  );
}
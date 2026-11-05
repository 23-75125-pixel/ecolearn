import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { BORDER, ICON } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

/**
 * Hero visual: one sharp photo and a verification badge.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
      <div className={cn("animate-fade-up relative aspect-[4/3] overflow-hidden rounded-md [animation-delay:250ms]", BORDER)}>
        <Image
          src="/image.jpeg"
          alt="A tutor guiding a young student through written work"
          fill
          priority
          quality={90}
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-white/80 px-2.5 py-1.5 backdrop-blur-md dark:bg-zinc-950/80">
          <ShieldCheck aria-hidden="true" className={ICON} />
          <span className="text-xs font-medium">Every tutor is admin-verified</span>
        </div>
      </div>
    </div>
  );
}

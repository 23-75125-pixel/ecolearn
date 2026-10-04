import Image from "next/image";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import { BORDER, ICON, ITEM_TITLE, SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const FLOAT_CARD = cn(
  "absolute flex items-center gap-3 rounded-md bg-white/70 p-3 backdrop-blur-md dark:bg-zinc-950/70",
  BORDER,
);
const ICON_TILE = cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", BORDER);

/**
 * Hero visual — one framed photo with a secondary photo and two static
 * stat cards. No shadows, blobs, or floating motion.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
      <div className="animate-fade-up relative aspect-[5/4] [animation-delay:250ms]">
        <div className={cn("relative h-full w-full overflow-hidden rounded-md", BORDER)}>
          <Image
            src="/carousel/filipino-classroom-4.png"
            alt="A tutor working one-on-one with a student"
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-cover"
          />
        </div>

        {/* Secondary photo */}
        <div className={cn("absolute -bottom-6 -left-4 hidden aspect-square w-36 overflow-hidden rounded-md sm:block lg:-left-8 lg:w-40", BORDER)}>
          <Image
            src="/carousel/filipino-classroom-2.png"
            alt="Students collaborating in a small-group session"
            fill
            quality={90}
            sizes="320px"
            className="object-cover"
          />
        </div>

        {/* Stat card — verification */}
        <div className={cn(FLOAT_CARD, "-right-3 top-8 sm:-right-6 lg:-right-8")}>
          <span className={ICON_TILE}>
            <ShieldCheck aria-hidden="true" className={ICON} />
          </span>
          <span className="min-w-0">
            <span className={cn("block", ITEM_TITLE)}>Admin-verified</span>
            <span className={cn("block", SUBTEXT)}>Credentials reviewed by our team</span>
          </span>
        </div>

        {/* Stat card — availability */}
        <div className={cn(FLOAT_CARD, "-left-3 top-[54%] hidden sm:flex lg:-left-12")}>
          <span className={ICON_TILE}>
            <CalendarCheck aria-hidden="true" className={ICON} />
          </span>
          <span className="min-w-0">
            <span className={cn("block", ITEM_TITLE)}>Slot booked</span>
            <span className={cn("block", SUBTEXT)}>Confirmed instantly, zero conflicts</span>
          </span>
        </div>
      </div>
    </div>
  );
}

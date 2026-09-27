import Image from "next/image";
import { CalendarCheck, ShieldCheck } from "lucide-react";

/**
 * Hero visual — layered photo composition with floating glass stat cards
 * and drifting decorative blobs. Pure CSS animation (server component);
 * the global prefers-reduced-motion rule collapses everything it needs to.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -left-14 top-6 h-64 w-64 rounded-full bg-primary-100 blur-3xl sm:-left-20 sm:h-80 sm:w-80"
      />
      <div
        aria-hidden="true"
        className="animate-drift-reverse pointer-events-none absolute -right-10 bottom-4 h-52 w-52 rounded-full bg-accent-500/15 blur-3xl sm:h-64 sm:w-64"
      />

      {/* Main photo */}
      <div className="animate-fade-up relative aspect-[4/5] [animation-delay:250ms]">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-border shadow-[0_48px_90px_-40px_rgba(16,88,79,0.4)]">
          <Image
            src="/carousel/filipino-classroom-4.png"
            alt="A tutor working one-on-one with a student"
            fill
            priority
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 512px, 520px"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#10584f]/35 via-transparent to-transparent"
          />
        </div>

        {/* Overlapping secondary photo */}
        <div className="animate-fade-up absolute -bottom-7 -left-5 hidden aspect-square w-36 -rotate-3 overflow-hidden rounded-2xl border-4 border-background shadow-xl [animation-delay:400ms] sm:block lg:-left-10 lg:w-44">
          <Image
            src="/carousel/filipino-classroom-2.png"
            alt="Students collaborating in a small-group session"
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>

        {/* Floating card — verification */}
        <div className="animate-float absolute -right-3 top-8 flex items-center gap-3 rounded-2xl border border-border bg-background/90 py-3 pl-3 pr-4 shadow-[0_18px_40px_-18px_rgba(16,88,79,0.45)] backdrop-blur sm:-right-6 lg:-right-10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <ShieldCheck size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-foreground">
              Admin-verified
            </span>
            <span className="block text-xs leading-5 text-muted">
              Credentials reviewed by our team
            </span>
          </span>
        </div>

        {/* Floating card — availability */}
        <div className="animate-float-delayed absolute -left-3 top-[54%] hidden items-center gap-3 rounded-2xl border border-border bg-background/90 py-3 pl-3 pr-4 shadow-[0_18px_40px_-18px_rgba(16,88,79,0.45)] backdrop-blur sm:flex lg:-left-14">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-500">
            <CalendarCheck size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-foreground">
              Slot booked
            </span>
            <span className="block text-xs leading-5 text-muted">
              Confirmed instantly, zero conflicts
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
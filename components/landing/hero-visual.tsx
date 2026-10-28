<<<<<<< HEAD
"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarCheck, CircleCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BORDER, ICON, ITEM_TITLE, SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const SLOTS = [
  { id: "3pm", label: "3:00 PM", taken: false },
  { id: "4pm", label: "4:00 PM", taken: true },
  { id: "5pm", label: "5:00 PM", taken: false },
  { id: "6pm", label: "6:00 PM", taken: false },
];

/**
 * Hero visual: one sharp photo and a small interactive booking preview.
 * The preview shows the core promise of the product (pick a free slot, get a
 * confirmed session, taken slots cannot be chosen) without needing an account.
 */
export function HeroVisual() {
  const [selected, setSelected] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const chosen = SLOTS.find((slot) => slot.id === selected);

  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none lg:pb-10">
      <div className={cn("animate-fade-up relative aspect-[4/3] overflow-hidden rounded-md [animation-delay:250ms]", BORDER)}>
        <Image
          src="/landing/hero-tutor.webp"
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

      <div
        className={cn(
          "animate-fade-up mt-3 rounded-md bg-white p-4 [animation-delay:450ms] dark:bg-zinc-950",
          "sm:absolute sm:-bottom-2 sm:right-4 sm:mt-0 sm:w-[17.5rem] lg:-right-4 lg:bottom-0",
          BORDER,
        )}
      >
        {booked && chosen ? (
          <div role="status" className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.75] text-brand-600 dark:text-brand-400" />
              <div>
                <p className={ITEM_TITLE}>Session booked</p>
                <p className={cn(SUBTEXT, "mt-0.5 leading-5")}>{chosen.label} is yours. No conflicts, and your tutor is notified.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setBooked(false);
                setSelected(null);
              }}
            >
              Try another time
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarCheck aria-hidden="true" className={ICON} />
                <span className={ITEM_TITLE}>Book a session</span>
              </div>
              <span className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Preview
              </span>
            </div>
            <div role="radiogroup" aria-label="Choose a time" className="grid grid-cols-2 gap-2">
              {SLOTS.map((slot) => {
                const isSelected = slot.id === selected;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={slot.taken ? `${slot.label}, already booked` : slot.label}
                    disabled={slot.taken}
                    onClick={() => setSelected(slot.id)}
                    className={cn(
                      "h-9 rounded-md border text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                      isSelected
                        ? "border-brand-600 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-400"
                        : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500",
                      slot.taken && "cursor-not-allowed text-zinc-400 line-through hover:border-zinc-300 dark:text-zinc-600 dark:hover:border-zinc-700",
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
            <Button type="button" size="sm" disabled={!selected} onClick={() => setBooked(true)}>
              {chosen ? `Book ${chosen.label}` : "Pick a time"}
            </Button>
          </div>
        )}
=======
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
>>>>>>> origin/main
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { ArrowRight, CalendarClock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

const FIRST_ROW = [
  { label: "Mathematics · Exam prep", image: "/carousel/filipino-classroom-1.png" },
  { label: "Science · Lab skills", image: "/carousel/filipino-classroom-2.png" },
  { label: "English · Reading circle", image: "/carousel/filipino-classroom-3.png" },
  { label: "Programming · Code together", image: "/carousel/filipino-classroom-4.png" },
];

const SECOND_ROW = [
  { label: "Mathematics · One-on-one", image: "/carousel/filipino-classroom-5.png" },
  { label: "Science · Study group", image: "/carousel/filipino-classroom-6.png" },
  { label: "English · Writing workshop", image: "/carousel/filipino-classroom-7.png" },
  { label: "Programming · Project review", image: "/carousel/filipino-classroom-2.png" },
];

function MarqueeRow({
  items,
  duration,
}: {
  items: { label: string; image: string }[];
  duration: string;
}) {
  // The track is rendered twice so the -50% keyframe loops seamlessly.
  const doubled = [...items, ...items];

  return (
    <div
      className="flex w-max gap-4 pr-4 sm:gap-5 sm:pr-5"
      style={
        {
          "--marquee-duration": duration,
        } as CSSProperties
      }
    >
      {doubled.map((item, index) => (
        <figure
          key={`${item.label}-${index}`}
          aria-hidden={index >= items.length}
          className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface sm:h-52 sm:w-80"
        >
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(max-width: 640px) 256px, 320px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <figcaption className="absolute bottom-3 left-3 right-3">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {item.label}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function ShowcaseMarquee() {
  return (
    <section aria-label="Learning sessions on Eco Learn" className="relative py-14 sm:py-20">
      <div className="marquee space-y-4 sm:space-y-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee">
          <MarqueeRow items={FIRST_ROW} duration="52s" />
        </div>
        <div className="animate-marquee-reverse">
          <MarqueeRow items={SECOND_ROW} duration="60s" />
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm text-muted sm:mt-12">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={17} className="text-primary-600" />
          Admin-verified tutors
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarClock size={17} className="text-primary-600" />
          Real-time availability
        </span>
        <Link
          href="/tutors"
          className="group inline-flex items-center gap-2 font-medium text-primary-700 hover:text-primary-600"
        >
          Browse the directory
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}

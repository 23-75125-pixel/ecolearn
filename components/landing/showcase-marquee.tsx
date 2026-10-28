"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { BORDER, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

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
      className="flex w-max gap-4 pr-4"
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
          className={cn("relative h-44 w-64 shrink-0 overflow-hidden rounded-md sm:h-52 sm:w-80", BORDER, SURFACE)}
        >
          <Image
            src={item.image}
            alt=""
            fill
            quality={85}
            sizes="(max-width: 640px) 320px, 400px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
          <figcaption className="absolute bottom-3 left-3 right-3">
            <span className="inline-flex items-center rounded-md bg-zinc-950/40 px-2 py-1 text-xs font-medium text-zinc-50 backdrop-blur-md">
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
    <section aria-label="Learning sessions on Eco Learn" className="relative pb-10 pt-14 sm:pt-16">
      <div className="marquee space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee">
          <MarqueeRow items={FIRST_ROW} duration="52s" />
        </div>
        <div className="animate-marquee-reverse">
          <MarqueeRow items={SECOND_ROW} duration="60s" />
        </div>
      </div>
    </section>
  );
}

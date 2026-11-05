import Image from "next/image";
import { BORDER, SECTION, SUBTEXT } from "@/lib/ui/styles";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

const MOMENTS = [
  {
    src: "/landing/session-review.webp",
    alt: "A teacher reviewing a student's written work at a desk",
    caption: "Reviewing your work together",
    note: "Feedback on the exact answers you wrote.",
  },
  {
    src: "/landing/session-board.webp",
    alt: "A teacher explaining a problem on the blackboard",
    caption: "Explaining it step by step",
    note: "Hard topics broken into small, clear steps.",
  },
  {
    src: "/landing/session-visual.webp",
    alt: "A teacher using a visual aid to explain an idea to a student",
    caption: "Making ideas easy to see",
    note: "Examples and visuals that make it click.",
  },
];

export function SessionGallery() {
  const cards = [...MOMENTS, ...MOMENTS];

  return (
    <section aria-labelledby="sessions-heading" className="overflow-hidden pb-20 sm:pb-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 id="sessions-heading" className={SECTION}>
          What a good session looks like.
        </h2>
        <p className={cn(SUBTEXT, "mt-3 leading-6")}>Focused, patient and built around the learner in front of the tutor.</p>
      </div>
      <div className="marquee mt-10" tabIndex={0} aria-label="Session examples carousel">
        <div
          className="animate-marquee flex w-max gap-6 px-4 sm:px-6"
          style={{ "--marquee-duration": "32s" } as CSSProperties}
        >
          {cards.map((moment, index) => (
            <figure key={`${moment.src}-${index}`} className="w-[min(78vw,24rem)] shrink-0">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-md", BORDER)}>
                <Image
                  src={moment.src}
                  alt={index >= MOMENTS.length ? "" : moment.alt}
                  fill
                  quality={88}
                  sizes="(max-width: 768px) 78vw, 384px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3">
                <span className="block text-sm font-medium">{moment.caption}</span>
                <span className={cn(SUBTEXT, "mt-0.5 block")}>{moment.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

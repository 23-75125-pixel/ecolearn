import Image from "next/image";
import { BORDER, SECTION, SUBTEXT } from "@/lib/ui/styles";
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
  return (
    <section aria-labelledby="sessions-heading" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="sessions-heading" className={SECTION}>
          What a good session looks like.
        </h2>
        <p className={cn(SUBTEXT, "mt-3 leading-6")}>Focused, patient and built around the learner in front of the tutor.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {MOMENTS.map((moment) => (
          <figure key={moment.src}>
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-md", BORDER)}>
              <Image
                src={moment.src}
                alt={moment.alt}
                fill
                quality={88}
                sizes="(max-width: 768px) 100vw, 384px"
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
    </section>
  );
}

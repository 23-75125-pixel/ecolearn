import { LEGAL_LAST_UPDATED } from "@/lib/constants/site";
import { SECTION, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

/** Shared layout for the Terms of Service and Privacy Policy pages. */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className={TITLE}>{title}</h1>
      <p className={cn(SUBTEXT, "mt-2")}>Last updated: {LEGAL_LAST_UPDATED}</p>
      <p className="mt-6 leading-7">{intro}</p>

      {sections.map((section, index) => (
        <section key={section.heading} className="mt-10">
          <h2 className={SECTION}>
            {index + 1}. {section.heading}
          </h2>
          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-3 leading-7">
              {text}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-7">
              {section.bullets.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

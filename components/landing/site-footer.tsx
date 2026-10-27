import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BORDER_COLOR, ICON, INTERACTIVE, ITEM_TITLE, SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/tutors", label: "Find tutors" },
      { href: "/about", label: "About" },
      { href: "/register", label: "Register" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "How it works",
    links: [
      { href: "/#how-it-works", label: "The three steps" },
      { href: "/#features", label: "Platform features" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/register", label: "Join as a student" },
      { href: "/register", label: "Apply as a tutor" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function SiteFooter() {
  return (
    <footer className={cn("border-t", BORDER_COLOR)}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <BrandLogo href="/" />
            <p className={cn(SUBTEXT, "mt-4 leading-6")}>
              Eco Learn connects students with administrator-verified tutors and
              manages appointment booking end to end.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className={ITEM_TITLE}>{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className={cn(
                        "inline-block rounded-md hover:text-zinc-900 dark:hover:text-zinc-50",
                        SUBTEXT,
                        INTERACTIVE,
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={cn("mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row", BORDER_COLOR, SUBTEXT)}>
          <p>© {new Date().getFullYear()} Eco Learn. All rights reserved.</p>
          <nav aria-label="Legal" className="flex gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={cn("rounded-md hover:text-zinc-900 dark:hover:text-zinc-50", INTERACTIVE)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="inline-flex items-center gap-2">
            <CircleCheck aria-hidden="true" className={ICON} />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}

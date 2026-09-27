import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";

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

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <BrandLogo href="/" />
            <p className="mt-4 text-sm leading-7 text-muted">
              Eco Learn connects students with administrator-verified tutors and
              manages appointment booking end to end.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-primary-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Eco Learn. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-500" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}

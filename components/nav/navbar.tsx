"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface NavLinkItem {
  href: string;
  label: string;
}

export function Navbar({
  brandHref,
  links,
  rightSlot,
}: {
  brandHref: string;
  links: NavLinkItem[];
  rightSlot?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={brandHref} className="flex items-center gap-2 font-semibold text-primary-700">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white"
          >
            E
          </span>
          ECoLearn
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface",
                pathname === link.href && "bg-primary-50 text-primary-700",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{rightSlot}</div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-surface md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {open ? "\u2715" : "\u2630"}
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-border md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface",
                  pathname === link.href && "bg-primary-50 text-primary-700",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {rightSlot}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

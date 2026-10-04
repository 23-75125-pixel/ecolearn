"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonClasses } from "@/components/ui/button";
import { ACTIVE, BORDER_COLOR, ICON, INTERACTIVE } from "@/lib/ui/styles";

export interface NavLinkItem {
  href: string;
  label: string;
}

function navLinkClasses(active: boolean) {
  return cn(
    "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium",
    INTERACTIVE,
    active
      ? ACTIVE
      : "text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50",
  );
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
    <header className={cn("backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 sticky top-0 z-50 border-b", BORDER_COLOR)}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <BrandLogo href={brandHref} />

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={navLinkClasses(pathname === link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">{rightSlot}</div>

        <button
          type="button"
          className={buttonClasses({ variant: "ghost", size: "icon", className: "md:hidden" })}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className={ICON} /> : <Menu className={ICON} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className={cn("border-t md:hidden", BORDER_COLOR)}>
          <div className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className={navLinkClasses(pathname === link.href)}
              >
                {link.label}
              </Link>
            ))}
            <div className={cn("mt-2 flex flex-col gap-2 border-t pt-3", BORDER_COLOR)}>
              {rightSlot}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

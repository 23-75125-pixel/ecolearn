import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * Terms and Privacy Policy are readable by everyone, including people who are
 * signed in and people finishing sign-up. They use a plain frame with no
 * landing-page navigation or footer.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <BrandLogo href="/" />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

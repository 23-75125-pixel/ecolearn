import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-lg font-semibold text-primary-700"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-600 text-base font-bold text-white"
          >
            E
          </span>
          ECoLearn
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

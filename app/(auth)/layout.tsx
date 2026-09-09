import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <BrandLogo />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

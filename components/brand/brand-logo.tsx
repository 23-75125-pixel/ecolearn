import Link from "next/link";

function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 3 7 11v13c0 10.5 6.9 17.8 17 21 10.1-3.2 17-10.5 17-21V11L24 3Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M24 12v27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M24 26c-7.2-1.1-11.2-4.9-12.6-10.8C18 16.1 22.4 19.4 24 26Z"
        fill="var(--primary-500)"
      />
      <path
        d="M24 32c7.2-1.1 11.2-4.9 12.6-10.8C30 22.1 25.6 25.4 24 32Z"
        fill="var(--accent-500)"
      />
      <path
        d="M24 19c-4.2-3.2-5.1-7.5-2.6-12.5 4.6 3.4 5.5 7.6 2.6 12.5Z"
        fill="var(--primary-600)"
      />
      <path
        d="M18 10.5 24 7l6 3.5-6 3.5-6-3.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M24 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20.5 38.5h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="Eco Learn home">
      <BrandMark className="h-10 w-10 text-primary-700 transition-transform group-hover:scale-105" />
      <span className="text-xl font-bold tracking-tight text-primary-700">
        Eco <span className="text-foreground">Learn</span>
      </span>
    </Link>
  );
}

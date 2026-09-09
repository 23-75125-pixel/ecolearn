import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Find a vetted tutor. Book with confidence.
        </h1>
        <p className="mt-4 text-lg text-muted">
          ECoLearn verifies every tutor&apos;s credentials before they can accept a
          single appointment — so you can spend your time learning, not vetting.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/tutors"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary-600 px-6 text-sm font-medium text-white hover:bg-primary-700"
          >
            Find a tutor
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground hover:bg-surface"
          >
            Become a tutor
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
        {[
          {
            title: "1. Tutors apply",
            body: "Tutors submit academic background, teaching experience, and credentials for review.",
          },
          {
            title: "2. Admins verify",
            body: "An administrator reviews every application before a tutor can appear publicly.",
          },
          {
            title: "3. Students book",
            body: "Only approved tutors can set availability — so every listing is verified.",
          },
        ].map((step) => (
          <div key={step.title} className="rounded-lg border border-border p-6">
            <h2 className="font-semibold text-foreground">{step.title}</h2>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

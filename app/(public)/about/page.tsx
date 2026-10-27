import { SUBTEXT, TITLE } from "@/lib/ui/styles";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className={TITLE}>About ECoLearn</h1>
      <p className={`${SUBTEXT} mt-4 leading-6`}>
        ECoLearn is a web platform for tutor vetting and automated student
        appointments. Every tutor is reviewed by an administrator before they
        can accept bookings, so students can find help with confidence.
      </p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BookingForm } from "@/components/student/booking-form";
import { unwrapRelation } from "@/lib/utils/relations";
import { BORDER, DIVIDE, ITEM_TITLE, SECTION, SUBTEXT, SURFACE, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { shortTime, todayInAppTimeZone } from "@/lib/utils/datetime";
import { uuidSchema } from "@/lib/validations/common";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;
  if (!uuidSchema.safeParse(tutorId).success) notFound();

  const supabase = await createClient();

  const { data: tutor } = await supabase
    .from("tutor_profiles")
    .select(
      "id, headline, bio, profiles(first_name, last_name), tutor_subjects(subjects(name))",
    )
    .eq("id", tutorId)
    .eq("is_active", true)
    .maybeSingle();

  if (!tutor) notFound();

  const profile = unwrapRelation(tutor.profiles);
  const subjects = (tutor.tutor_subjects ?? [])
    .map((ts) => unwrapRelation(ts.subjects)?.name)
    .filter((name): name is string => Boolean(name));

  const { data: slots } = await supabase
    .from("appointment_slots")
    .select("id, slot_date, start_time, end_time, subject_id, subjects(name)")
    .eq("tutor_profile_id", tutorId)
    .eq("status", "open")
    .gte("slot_date", todayInAppTimeZone())
    .order("slot_date")
    .order("start_time")
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className={cn("flex h-14 w-14 items-center justify-center rounded-md text-xl font-medium", BORDER, SURFACE)}
        >
          {profile?.first_name?.[0] ?? "?"}
        </div>
        <div className="space-y-1.5">
          <h1 className={TITLE}>
            {profile?.first_name} {profile?.last_name}
          </h1>
          <Badge tone="success">Verified tutor</Badge>
        </div>
      </div>

      {tutor.headline && (
        <p className={cn(SECTION, "mt-8")}>{tutor.headline}</p>
      )}
      {tutor.bio && <p className={cn(SUBTEXT, "mt-2 leading-6")}>{tutor.bio}</p>}

      {subjects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {subjects.map((name) => (
            <Badge key={name} tone="info">
              {name}
            </Badge>
          ))}
        </div>
      )}

      <div className={cn("mt-10 rounded-md p-6", BORDER)}>
        <h2 className={SECTION}>Available sessions</h2>
        {!slots || slots.length === 0 ? (
          <p className={cn(SUBTEXT, "mt-3")}>No open sessions are available right now.</p>
        ) : (
          <ul className={cn("mt-4", DIVIDE)}>
            {slots.map((slot) => {
              const subject = unwrapRelation(slot.subjects);
              return (
                <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className={ITEM_TITLE}>{slot.slot_date}</p>
                    <p className={SUBTEXT}>{shortTime(slot.start_time)} to {shortTime(slot.end_time)}{subject?.name ? ` · ${subject.name}` : ""}</p>
                  </div>
                  <BookingForm slotId={slot.id} label="session" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

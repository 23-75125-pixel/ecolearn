import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BookingForm } from "@/components/student/booking-form";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;
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

  const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
  const subjects = (tutor.tutor_subjects ?? [])
    .map((ts) => (Array.isArray(ts.subjects) ? ts.subjects[0]?.name : ts.subjects?.name))
    .filter(Boolean);

  const { data: slots } = await supabase
    .from("appointment_slots")
    .select("id, slot_date, start_time, end_time, subject_id, subjects(name)")
    .eq("tutor_profile_id", tutorId)
    .eq("status", "open")
    .gte("slot_date", new Date().toISOString().slice(0, 10))
    .order("slot_date")
    .order("start_time")
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-700"
        >
          {profile?.first_name?.[0] ?? "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {profile?.first_name} {profile?.last_name}
          </h1>
          <Badge tone="success">Verified tutor</Badge>
        </div>
      </div>

      {tutor.headline && (
        <p className="mt-6 text-lg font-medium text-foreground">{tutor.headline}</p>
      )}
      {tutor.bio && <p className="mt-2 text-muted">{tutor.bio}</p>}

      {subjects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {subjects.map((name) => (
            <Badge key={name} tone="info">
              {name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Available sessions</h2>
        {!slots || slots.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No open sessions are available right now.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {slots.map((slot) => {
              const subject = Array.isArray(slot.subjects) ? slot.subjects[0] : slot.subjects;
              return (
                <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-medium text-foreground">{slot.slot_date}</p><p className="text-sm text-muted">{slot.start_time.slice(0, 5)} to {slot.end_time.slice(0, 5)}{subject?.name ? ` · ${subject.name}` : ""}</p></div>
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

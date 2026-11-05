import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { BookingForm } from "@/components/student/booking-form";
import { BORDER, DIVIDE, ICON, ITEM_TITLE, SECTION, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { formatClock, formatSlotDate, formatTimeRange } from "@/lib/utils/datetime";
import { unwrapRelation } from "@/lib/utils/relations";
import type { getOpenSlots, getPublicTutor } from "@/lib/queries/tutors";

type Tutor = NonNullable<Awaited<ReturnType<typeof getPublicTutor>>>;
type Slots = Awaited<ReturnType<typeof getOpenSlots>>;

/**
 * A tutor's public profile and open times. A signed-in student can book; a
 * guest sees the same times with a single "log in to book" link.
 */
export function TutorProfileView({ tutor, slots, canBook }: { tutor: Tutor; slots: Slots; canBook: boolean }) {
  const profile = unwrapRelation(tutor.profiles);
  const subjects = (tutor.tutor_subjects ?? [])
    .map((item) => unwrapRelation(item.subjects)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          avatarUrl={profile?.avatar_url}
          size="lg"
        />
        <div className="space-y-1.5">
          <h1 className={TITLE}>
            {profile?.first_name} {profile?.last_name}
          </h1>
          <Badge tone="success">Verified tutor</Badge>
        </div>
      </div>

      {tutor.headline && <p className={cn(SECTION, "mt-8")}>{tutor.headline}</p>}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={SECTION}>Available sessions</h2>
          {!canBook && slots.length > 0 && (
            <Link href="/login" className={buttonClasses({ size: "sm" })}>
              Log in to book
            </Link>
          )}
        </div>
        {slots.length === 0 ? (
          <p className={cn(SUBTEXT, "mt-3")}>No open sessions are available right now.</p>
        ) : (
          <ul className={cn("mt-4", DIVIDE)}>
            {slots.map((slot) => {
              const subject = unwrapRelation(slot.subjects);
              const online = slot.session_mode === "online";
              const Icon = online ? Video : MapPin;
              return (
                <li key={slot.id} data-testid="open-slot" className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className={ITEM_TITLE}>{formatSlotDate(slot.slot_date)}</p>
                    <p className={SUBTEXT}>
                      {formatTimeRange(slot.start_time, slot.end_time)}
                      {subject?.name ? ` - ${subject.name}` : ""}
                    </p>
                    <p className={cn(SUBTEXT, "mt-1 flex items-center gap-1.5")}>
                      <Icon aria-hidden="true" className={ICON} />
                      {online ? "Online (meeting link shared after confirmation)" : "In person"}
                    </p>
                  </div>
                  {canBook && <BookingForm slotId={slot.id} timeLabel={`${formatClock(slot.start_time)} on ${formatSlotDate(slot.slot_date)}`} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

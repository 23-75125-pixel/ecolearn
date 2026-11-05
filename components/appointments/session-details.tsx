import { ExternalLink, MapPin, Video } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { BORDER, ICON, ITEM_TITLE, SUBTEXT, SURFACE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import type { AppointmentView } from "@/lib/appointments/view";
import type { AppointmentActor } from "@/lib/appointments/rules";

/**
 * How the two people meet. Online sessions happen on the meeting link the tutor
 * set for that availability window; in-person sessions happen at the tutor's
 * location. A student only sees these once the tutor has confirmed the session.
 */
export function SessionDetails({ appointment, actor }: { appointment: AppointmentView; actor: AppointmentActor }) {
  const { status, expired, sessionMode, meetingUrl, location } = appointment;
  if (status === "cancelled" || status === "no_show" || expired) return null;

  const hiddenFromStudent = actor === "student" && status === "scheduled";
  const online = sessionMode === "online";
  const Icon = online ? Video : MapPin;

  return (
    <div className={cn("mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md p-3", BORDER, SURFACE)}>
      <div className="flex min-w-0 items-start gap-2">
        <Icon aria-hidden="true" className={cn(ICON, "mt-0.5")} />
        <div className="min-w-0">
          <p className={ITEM_TITLE}>{online ? "Online session" : "In-person session"}</p>
          {hiddenFromStudent ? (
            <p className={SUBTEXT}>
              {online ? "The meeting link" : "The meeting place"} will appear here once your tutor confirms.
            </p>
          ) : online ? (
            <p className={SUBTEXT}>
              {meetingUrl ? "Join on the meeting link at the session time." : "Your tutor has not shared a meeting link yet."}
            </p>
          ) : (
            <p className={cn(SUBTEXT, "break-words")}>{location ?? "Your tutor has not shared a place yet."}</p>
          )}
        </div>
      </div>
      {!hiddenFromStudent && online && meetingUrl && status !== "completed" && (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ size: "sm" })}
        >
          Join session
          <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 stroke-[1.75]" />
        </a>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { CancelAppointmentForm, StepButton } from "@/components/appointments/appointment-actions";
import { SessionDetails } from "@/components/appointments/session-details";
import { getAppointmentActions, type AppointmentActor } from "@/lib/appointments/rules";
import type { AppointmentHandlers } from "@/lib/appointments/types";
import { statusLabel, statusTone, type AppointmentView } from "@/lib/appointments/view";
import { DIVIDE, ITEM_TITLE, SUBTEXT } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import { formatSlotDate, formatTimeRange } from "@/lib/utils/datetime";

/**
 * A list of appointments for a student or a tutor. It shows the buttons that
 * make sense right now (see lib/appointments/rules.ts); the database decides
 * whether each click is really allowed.
 */
export function AppointmentList({
  appointments,
  actor,
  handlers,
}: {
  appointments: AppointmentView[];
  actor: AppointmentActor;
  handlers: AppointmentHandlers;
}) {
  const now = new Date();
  const otherPartyLabel = actor === "student" ? "Tutor" : "Student";

  return (
    <ul className={DIVIDE}>
      {appointments.map((appointment) => {
        const actions = getAppointmentActions({
          actor,
          status: appointment.status,
          startsAt: new Date(appointment.startsAtIso),
          now,
        });

        return (
          <li key={appointment.id} data-testid="appointment" data-status={appointment.status} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={ITEM_TITLE}>
                  <span className="sr-only">{otherPartyLabel}: </span>
                  {appointment.otherPartyName}
                  {appointment.subjectName ? ` - ${appointment.subjectName}` : ""}
                </p>
                <p className={SUBTEXT}>
                  {formatSlotDate(appointment.slotDate)}, {formatTimeRange(appointment.startTime, appointment.endTime)}
                </p>
                {actor === "tutor" && appointment.studentNotes && (
                  <p className={cn(SUBTEXT, "mt-1 break-words")}>Student note: {appointment.studentNotes}</p>
                )}
                {appointment.status === "cancelled" && appointment.cancellationReason && (
                  <p className={cn(SUBTEXT, "mt-1 break-words")}>Reason: {appointment.cancellationReason}</p>
                )}
              </div>
              <Badge tone={statusTone(appointment)}>{statusLabel(appointment)}</Badge>
            </div>

            <SessionDetails appointment={appointment} actor={actor} />

            {(actions.canConfirm || actions.canComplete || actions.canMarkNoShow || actions.canCancel) && (
              <div className="mt-3 flex flex-wrap items-start gap-2">
                {actions.canConfirm && handlers.confirm && (
                  <StepButton action={handlers.confirm} appointmentId={appointment.id} icon="confirm">
                    Confirm session
                  </StepButton>
                )}
                {actions.canComplete && handlers.complete && (
                  <StepButton action={handlers.complete} appointmentId={appointment.id} icon="complete">
                    Mark as completed
                  </StepButton>
                )}
                {actions.canMarkNoShow && handlers.noShow && (
                  <StepButton action={handlers.noShow} appointmentId={appointment.id} icon="no-show">
                    Student did not show up
                  </StepButton>
                )}
                {actions.canCancel && (
                  <CancelAppointmentForm
                    action={handlers.cancel}
                    appointmentId={appointment.id}
                    reasonRequired={actor === "tutor"}
                  />
                )}
              </div>
            )}
            {actions.cancelBlockedReason && <p className={cn(SUBTEXT, "mt-2")}>{actions.cancelBlockedReason}</p>}
          </li>
        );
      })}
    </ul>
  );
}

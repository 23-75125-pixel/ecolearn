"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { BORDER, ICON_INLINE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";
import type { AppointmentAction } from "@/lib/appointments/types";
import { CircleCheck, UserX, X } from "lucide-react";

/** One-click step (confirm, complete, no-show). The error, if any, appears next to the button. */
export function StepButton({
  action,
  appointmentId,
  children,
  icon,
}: {
  action: AppointmentAction;
  appointmentId: string;
  children: ReactNode;
  icon: "confirm" | "complete" | "no-show";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const Icon = icon === "no-show" ? UserX : CircleCheck;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <Button type="submit" size="sm" variant={icon === "confirm" ? "primary" : "secondary"} isLoading={pending}>
        {!pending && <Icon aria-hidden="true" className={ICON_INLINE} />}
        {children}
      </Button>
      {state?.error && <Alert>{state.error}</Alert>}
    </form>
  );
}

/**
 * "Cancel session" opens a small form so the person can add a reason first.
 * A tutor must give a reason (the student is told why), a student may.
 */
export function CancelAppointmentForm({
  action,
  appointmentId,
  reasonRequired,
}: {
  action: AppointmentAction;
  appointmentId: string;
  reasonRequired: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);
  const fieldId = `cancel-reason-${appointmentId}`;

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <X aria-hidden="true" className={ICON_INLINE} />
        Cancel session
      </Button>
    );
  }

  return (
    <form action={formAction} className={cn("w-full space-y-3 rounded-md p-3", BORDER)}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div>
        <Label htmlFor={fieldId}>{reasonRequired ? "Reason (the student will see this)" : "Reason (optional)"}</Label>
        <Textarea id={fieldId} name="reason" rows={2} maxLength={500} required={reasonRequired} />
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={pending}>
          Confirm cancellation
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Keep session
        </Button>
      </div>
    </form>
  );
}

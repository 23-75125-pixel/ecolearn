"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import {
  approveApplication,
  rejectApplication,
  requestRevision,
  type ReviewFormState,
} from "@/app/admin/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label, FieldError } from "@/components/ui/label";
import { ConfirmSubmit } from "@/components/ui/action-dialog";
import { BORDER, ICON, ICON_INLINE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const initialState: ReviewFormState = null;
const PANEL = cn("space-y-4 rounded-md p-4", BORDER);

export function ReviewActions({ applicationId }: { applicationId: string }) {
  const [mode, setMode] = useState<"idle" | "reject" | "revision">("idle");
  const [approveState, approveAction] = useActionState(
    approveApplication,
    initialState,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectApplication,
    initialState,
  );
  const [revisionState, revisionAction, revisionPending] = useActionState(
    requestRevision,
    initialState,
  );

  if (mode === "reject") {
    return (
      <form action={rejectAction} className={PANEL}>
        <input type="hidden" name="applicationId" value={applicationId} />
        <div>
          <Label htmlFor="reject-reason">Reason for rejection</Label>
          <Textarea id="reject-reason" name="reason" required rows={3} />
          <FieldError>{rejectState?.error}</FieldError>
        </div>
        <div className="flex gap-2">
          <ConfirmSubmit
            message="Reject this tutor application? This decision will be sent to the tutor."
            className={buttonClasses()}
          >
            <X className={ICON_INLINE} />
            Confirm rejection
          </ConfirmSubmit>
          <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (mode === "revision") {
    return (
      <form action={revisionAction} className={PANEL}>
        <input type="hidden" name="applicationId" value={applicationId} />
        <div>
          <Label htmlFor="revision-reason">What needs to be corrected?</Label>
          <Textarea id="revision-reason" name="reason" required rows={3} />
          <FieldError>{revisionState?.error}</FieldError>
        </div>
        <div className="flex gap-2">
          <Button type="submit" isLoading={revisionPending}>
            Send feedback
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form action={approveAction}>
        <input type="hidden" name="applicationId" value={applicationId} />
        <ConfirmSubmit
          message="Approve this tutor application? The tutor will become visible in the directory."
          className={buttonClasses()}
        >
          <Check className={ICON_INLINE} />
          Approve
        </ConfirmSubmit>
        <FieldError>{approveState?.error}</FieldError>
      </form>
      <Button variant="outline" onClick={() => setMode("revision")}>
        <Pencil className={ICON} />
        Request revision
      </Button>
      <Button variant="danger" onClick={() => setMode("reject")}>
        <X className={ICON} />
        Reject
      </Button>
    </div>
  );
}

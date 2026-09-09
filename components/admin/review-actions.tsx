"use client";

import { useActionState, useState } from "react";
import {
  approveApplication,
  rejectApplication,
  requestRevision,
  type ReviewFormState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label, FieldError } from "@/components/ui/label";

const initialState: ReviewFormState = null;

export function ReviewActions({ applicationId }: { applicationId: string }) {
  const [mode, setMode] = useState<"idle" | "reject" | "revision">("idle");
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectApplication,
    initialState,
  );
  const [revisionState, revisionAction, revisionPending] = useActionState(
    requestRevision,
    initialState,
  );

  if (mode === "reject") {
    return (
      <form action={rejectAction} className="space-y-3 rounded-md border border-border p-4">
        <input type="hidden" name="applicationId" value={applicationId} />
        <div>
          <Label htmlFor="reject-reason">Reason for rejection</Label>
          <textarea
            id="reject-reason"
            name="reason"
            required
            rows={3}
            className="w-full rounded-md border border-border p-2 text-sm"
          />
          <FieldError>{rejectState?.error}</FieldError>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="danger" isLoading={rejectPending}>
            Confirm rejection
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (mode === "revision") {
    return (
      <form action={revisionAction} className="space-y-3 rounded-md border border-border p-4">
        <input type="hidden" name="applicationId" value={applicationId} />
        <div>
          <Label htmlFor="revision-reason">What needs to be corrected?</Label>
          <textarea
            id="revision-reason"
            name="reason"
            required
            rows={3}
            className="w-full rounded-md border border-border p-2 text-sm"
          />
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
      <Button onClick={() => approveApplication(applicationId)}>Approve</Button>
      <Button variant="outline" onClick={() => setMode("revision")}>
        Request revision
      </Button>
      <Button variant="danger" onClick={() => setMode("reject")}>
        Reject
      </Button>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { bookSlot, type BookingState } from "@/app/student/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BORDER, ICON_INLINE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

/** "Book this time" opens a small form with an optional note for the tutor, then books the slot. */
export function BookingForm({ slotId, timeLabel }: { slotId: string; timeLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(bookSlot, null as BookingState);
  const noteId = `booking-note-${slotId}`;

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)} aria-label={`Book ${timeLabel}`}>
        <CalendarCheck aria-hidden="true" className={ICON_INLINE} />
        Book session
      </Button>
    );
  }

  return (
    <form action={action} className={cn("w-full space-y-3 rounded-md p-3 sm:w-80", BORDER)}>
      <input type="hidden" name="slotId" value={slotId} />
      <div>
        <Label htmlFor={noteId}>Note for your tutor (optional)</Label>
        <Textarea id={noteId} name="notes" rows={3} maxLength={1000} placeholder="What would you like help with?" />
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={pending}>
          Confirm booking
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

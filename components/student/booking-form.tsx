"use client";

import { useActionState } from "react";
import { bookSlot, type BookingState } from "@/app/student/actions";
import { Button } from "@/components/ui/button";

export function BookingForm({ slotId, label }: { slotId: string; label: string }) {
  const [state, action, pending] = useActionState(bookSlot, null as BookingState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slotId" value={slotId} />
      <Button type="submit" size="sm" isLoading={pending}>Book {label}</Button>
      {state?.error && <span role="alert" className="text-xs text-danger">{state.error}</span>}
      {state?.success && <span role="status" className="text-xs text-accent-500">{state.success}</span>}
    </form>
  );
}

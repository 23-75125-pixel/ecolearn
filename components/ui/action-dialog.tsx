"use client";

import { useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { BORDER, ICON, SECTION, SUBTEXT } from "@/lib/ui/styles";

const OVERLAY =
  "fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm";
const PANEL = cn("w-full max-w-sm rounded-md bg-zinc-50 p-6 dark:bg-zinc-950", BORDER);

export function ActionDialog({ error, success, onClose }: { error?: string; success?: string; onClose?: () => void }) {
  const message = error ?? success;
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const open = Boolean(message && message !== dismissedMessage);

  if (!open || !message) return null;
  const isError = Boolean(error);
  return (
    <div className={OVERLAY} role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="action-dialog-title" className={PANEL}>
        <div className="flex items-start gap-3">
          {isError ? <CircleAlert className={cn(ICON, "mt-1.5")} /> : <CircleCheck className={cn(ICON, "mt-1.5")} />}
          <div className="min-w-0 flex-1">
            <h2 id="action-dialog-title" className={SECTION}>{isError ? "Something went wrong" : "Success"}</h2>
            <p className={cn(SUBTEXT, "mt-2 leading-6")}>{message}</p>
          </div>
          <button
            type="button"
            onClick={() => { setDismissedMessage(message); onClose?.(); }}
            className={buttonClasses({ variant: "ghost", size: "icon", className: "-mr-2 -mt-2" })}
            aria-label="Close dialog"
            title="Close dialog"
          >
            <X className={ICON} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => { setDismissedMessage(message); onClose?.(); }}
          className={buttonClasses({ className: "mt-6 w-full" })}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function ConfirmSubmit({ message, children, className = "" }: { message: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  return <>
    <button type="button" onClick={(event) => { formRef.current = event.currentTarget.closest("form"); setOpen(true); }} className={className}>{children}</button>
    {open && (
      <div className={OVERLAY} role="presentation">
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className={PANEL}>
          <h2 id="confirm-dialog-title" className={SECTION}>Please confirm</h2>
          <p className={cn(SUBTEXT, "mt-2 leading-6")}>{message}</p>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonClasses({ variant: "secondary", className: "flex-1" })}>Cancel</button>
            <button type="button" onClick={() => { formRef.current?.requestSubmit(); setOpen(false); }} className={buttonClasses({ className: "flex-1" })}>Continue</button>
          </div>
        </div>
      </div>
    )}
  </>;
}

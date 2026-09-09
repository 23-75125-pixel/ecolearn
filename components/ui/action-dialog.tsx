"use client";

import { useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

export function ActionDialog({ error, success, onClose }: { error?: string; success?: string; onClose?: () => void }) {
  const message = error ?? success;
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const open = Boolean(message && message !== dismissedMessage);

  if (!open || !message) return null;
  const isError = Boolean(error);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12334a]/35 p-4" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="action-dialog-title" className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          {isError ? <CircleAlert className="shrink-0 text-danger" size={24} /> : <CheckCircle2 className="shrink-0 text-accent-500" size={24} />}
          <div className="min-w-0 flex-1"><h2 id="action-dialog-title" className="font-semibold text-foreground">{isError ? "Something went wrong" : "Success"}</h2><p className="mt-2 text-sm leading-6 text-muted">{message}</p></div>
          <button type="button" onClick={() => { setDismissedMessage(message); onClose?.(); }} className="text-muted hover:text-foreground" aria-label="Close dialog" title="Close dialog"><X size={18} /></button>
        </div>
        <button type="button" onClick={() => { setDismissedMessage(message); onClose?.(); }} className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">OK</button>
      </div>
    </div>
  );
}

export function ConfirmSubmit({ message, children, className = "" }: { message: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  return <>
    <button type="button" onClick={(event) => { formRef.current = event.currentTarget.closest("form"); setOpen(true); }} className={className}>{children}</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12334a]/35 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl"><h2 id="confirm-dialog-title" className="font-semibold text-foreground">Please confirm</h2><p className="mt-2 text-sm leading-6 text-muted">{message}</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-surface">Cancel</button><button type="button" onClick={() => { formRef.current?.requestSubmit(); setOpen(false); }} className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-danger px-4 text-sm font-semibold text-white hover:opacity-90">Continue</button></div></div></div>}
  </>;
}

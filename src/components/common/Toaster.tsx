"use client";

import { CircleCheck, Info } from "lucide-react";
import { useToasts } from "@/lib/store";

export function Toaster() {
  const toasts = useToasts();
  return (
    // Top centre keeps toasts clear of the phone bottom navigation and the POS order panel.
    <div
      className="pointer-events-none fixed inset-x-3 top-3 z-50 flex flex-col items-center gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-in flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toast.tone === "success" ? (
            <CircleCheck className="size-4.5 shrink-0 text-white" />
          ) : (
            <Info className="size-4.5 shrink-0 text-accent-line" />
          )}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

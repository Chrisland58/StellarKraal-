"use client";

import { useContext } from "react";
import { ToastContext } from "./ToastContext";
import Toast from "./Toast";
import { positionToClasses } from "@/hooks/useToastPosition";

/**
 * ToastContainer — renders active toasts in the position set by the user.
 *
 * The container is fixed-position and reads `toastPosition` from ToastContext
 * so that changing the preference in Settings takes effect immediately without
 * a page reload.
 *
 * Position classes are derived from `positionToClasses` which maps the stored
 * preference (e.g. "top-right") to Tailwind fixed-position utility classes.
 */
export default function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast, toastPosition } = context;

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Notifications"
      className={`fixed z-50 flex flex-col gap-3 w-[min(360px,calc(100vw-2rem))] ${positionToClasses(toastPosition)}`}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

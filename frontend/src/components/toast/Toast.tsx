"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { Icon } from "@/components/Icon";
import { ToastItem, ToastVariant } from "./ToastContext";

const AUTO_DISMISS_MS = 4000;

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-700 text-white",
  error: "bg-red-700 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-blue-700 text-white",
};

const variantIcons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  
  // Swipe-to-dismiss states and refs
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      // pause timer while dragging
      if (isDragging) return;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startXRef.current;
    
    // Add resistance (rubber-band effect) if swiping
    // In this case we let it move 1-to-1 but snap back on end
    setTranslateX(deltaX);
  }

  function handleTouchEnd() {
    setIsDragging(false);
    if (toastRef.current && startXRef.current !== null) {
      const toastWidth = toastRef.current.offsetWidth;
      // Dismiss if swiped more than 50% of the width
      if (Math.abs(translateX) > toastWidth * 0.5) {
        // Animate off screen
        setTranslateX(translateX > 0 ? toastWidth : -toastWidth);
        handleDismiss();
      } else {
        // Snap back
        setTranslateX(0);
      }
    }
    startXRef.current = null;
  }

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live="polite"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        touchAction: 'pan-y'
      }}
      className={`relative flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg min-w-[16rem] max-w-sm transition-all duration-300 ${
        exiting && !isDragging ? "toast-exit" : "toast-enter"
      } ${variantStyles[toast.variant]}`}
    >
      <Icon
        icon={variantIcons[toast.variant]}
        size="md"
        className="mt-0.5 flex-shrink-0 text-white"
      />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={handleDismiss}
        aria-label="Close notification"
        className="text-white/80 hover:text-white transition text-lg leading-none"
      >
        ×
      </button>
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-b-xl transition-all duration-100"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  );
}


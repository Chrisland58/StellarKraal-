"use client";

import React, { createContext, useCallback, useState } from "react";
import { useToastPosition, type ToastPosition } from "@/hooks/useToastPosition";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, variant: ToastVariant) => void;
  removeToast: (id: string) => void;
  /** Current user-preferred toast position */
  toastPosition: ToastPosition;
  /** Persist a new toast position preference */
  setToastPosition: (pos: ToastPosition) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { position: toastPosition, setPosition: setToastPosition } = useToastPosition();

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = generateId();
    setToasts((prev: ToastItem[]) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev: ToastItem[]) => prev.filter((t: ToastItem) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toastPosition, setToastPosition }}>
      {children}
    </ToastContext.Provider>
  );
}

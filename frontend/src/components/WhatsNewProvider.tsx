"use client";

import WhatsNewModal, { useWhatsNew } from "./WhatsNewModal";

/**
 * WhatsNewProvider — thin client wrapper that manages the What's New modal
 * lifecycle via useWhatsNew.
 *
 * Embed this inside the root layout (inside ToastProvider / ThemeProvider)
 * so the modal auto-shows on first visit after a new deployment.
 */
export default function WhatsNewProvider() {
  const { isOpen, dismiss } = useWhatsNew();
  return <WhatsNewModal isOpen={isOpen} onClose={dismiss} />;
}

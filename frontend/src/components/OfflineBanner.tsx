'use client';
import { useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/components/toast';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const toast = useToast();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      // Only announce reconnection — never fires on initial mount while online.
      wasOffline.current = false;
      toast.success('Reconnected');
    }
  }, [isOnline, toast]);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-50 bg-brown text-cream text-center py-2 text-sm font-semibold"
    >
      You are offline. Some features may be unavailable.
    </div>
  );
}

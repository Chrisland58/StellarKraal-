import { useEffect, useRef, useState } from 'react';

interface AutoSaveOptions<T> {
  storageKey: string;
  data: T;
  enabled?: boolean;
  interval?: number;
  walletAddress?: string;
  /**
   * Saved data older than this (ms) is treated as if it were never saved:
   * it's discarded from localStorage and neither `hasSavedData` nor
   * `restoreSavedData()` will surface it. Omit for no expiry.
   */
  expiryMs?: number;
}

interface SavedData<T> {
  walletAddress?: string;
  data: T;
  timestamp: string;
}

/** How long after the last data change before showing the indicator (ms). */
const DRAFT_SAVED_DEBOUNCE_MS = 1000;

/** How long the indicator stays visible before fading out (ms). */
const DRAFT_SAVED_VISIBLE_MS = 3000;

export function useFormAutoSave<T extends Record<string, unknown>>({
  storageKey,
  data,
  enabled = true,
  interval = 5000,
  walletAddress,
  expiryMs,
}: AutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);
  /** True while the "Draft saved" indicator should be visible. */
  const [draftSaved, setDraftSaved] = useState(false);

  // Ref to hold the debounce timer ID so we can cancel it on re-runs.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SavedData<T> = JSON.parse(saved);
        if (isExpired(parsed, expiryMs)) {
          localStorage.removeItem(storageKey);
        } else if (!walletAddress || parsed.walletAddress === walletAddress) {
          setHasSavedData(true);
        }
      } catch {
        // Invalid saved data — ignore
      }
    }
  }, [storageKey, walletAddress, expiryMs]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    const hasData = Object.values(data).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true;
      return Boolean(value);
    });

    if (!hasData) return;

    const interval_id = setInterval(() => {
      const saveData: SavedData<T> = {
        data,
        timestamp: new Date().toISOString(),
      };
      if (walletAddress) {
        saveData.walletAddress = walletAddress;
      }
      localStorage.setItem(storageKey, JSON.stringify(saveData));
      setLastSaved(new Date());
    }, interval);

    return () => clearInterval(interval_id);
  }, [data, enabled, interval, storageKey, walletAddress]);

  // Debounced "Draft saved" indicator —
  // shows 1 s after the last change to `data`.
  useEffect(() => {
    if (!enabled) return;

    const hasData = Object.values(data).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true;
      return Boolean(value);
    });

    if (!hasData) return;

    // Cancel any pending debounce from a previous render
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDraftSaved(true);
      debounceTimerRef.current = null;
    }, DRAFT_SAVED_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [data, enabled]);

  // Fade-out timer — fires 3 s after the indicator becomes visible.
  useEffect(() => {
    if (!draftSaved) return;

    const fadeId = setTimeout(() => {
      setDraftSaved(false);
    }, DRAFT_SAVED_VISIBLE_MS);

    return () => clearTimeout(fadeId);
  }, [draftSaved]);

  const restoreSavedData = (): T | null => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    try {
      const parsed: SavedData<T> = JSON.parse(saved);
      if (isExpired(parsed, expiryMs)) {
        localStorage.removeItem(storageKey);
        setHasSavedData(false);
        return null;
      }
      if (walletAddress && parsed.walletAddress !== walletAddress) {
        return null;
      }
      setHasSavedData(false);
      return parsed.data;
    } catch {
      return null;
    }
  };

  const clearSavedData = () => {
    localStorage.removeItem(storageKey);
    setHasSavedData(false);
    setLastSaved(null);
  };

  return {
    lastSaved,
    hasSavedData,
    draftSaved,
    restoreSavedData,
    clearSavedData,
  };
}

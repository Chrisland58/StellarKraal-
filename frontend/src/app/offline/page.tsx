"use client";

import { useEffect, useState } from "react";

/**
 * OfflinePage — #1097
 *
 * Shown by the service worker when the user tries to navigate while offline.
 * This component:
 *   - Detects navigator.onLine on mount
 *   - Listens for the 'online' event and auto-reloads when connectivity returns
 *   - Shows a countdown / "reconnecting…" indicator
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // Brief delay so the "Back online!" message is visible before reloading
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function handleRetry() {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      window.location.reload();
    }, 400);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Illustration */}
      <div aria-hidden="true" className="mb-8">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="60" cy="60" r="56" fill="#FDF6EC" stroke="#D4A017" strokeWidth="3" />
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="44"
          >
            📡
          </text>
        </svg>
      </div>

      {isOnline ? (
        <>
          <h1 className="text-3xl font-bold text-brown mb-3">Back online!</h1>
          <p className="text-brown/60 max-w-sm mb-6">
            Your connection is restored. Reloading the page…
          </p>
          <div className="flex items-center gap-2 text-brown/50 text-sm">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Reloading…
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-3">
            No connection
          </p>
          <h1 className="text-3xl font-bold text-brown mb-3">
            You&apos;re offline
          </h1>
          <p className="text-brown/60 max-w-sm mb-8">
            StellarKraal needs an internet connection to show your loans and
            collateral. Check your Wi-Fi or mobile data, then try again.
          </p>

          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={handleRetry}
              disabled={checking}
              className="w-full bg-brown text-cream font-semibold px-6 py-3 rounded-xl
                hover:bg-brown/80 transition focus:outline-none focus:ring-2 focus:ring-gold
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="button"
            >
              {checking ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking…
                </>
              ) : (
                "Try again"
              )}
            </button>
            <a
              href="/"
              className="block w-full border border-brown/30 text-brown font-semibold px-6 py-3 rounded-xl
                hover:border-brown/60 transition focus:outline-none focus:ring-2 focus:ring-gold text-center"
            >
              Go home
            </a>
          </div>

          {/* Auto-reconnect notice */}
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-brown/40 mt-8"
          >
            This page will reload automatically when your connection returns.
          </p>
        </>
      )}
    </div>
  );
}

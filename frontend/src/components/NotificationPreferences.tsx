"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface NotificationSettings {
  healthFactorAlerts: boolean;
  repaymentReminders: boolean;
  liquidationWarnings: boolean;
}

const TOGGLES: { key: keyof NotificationSettings; label: string; description: string }[] = [
  {
    key: "healthFactorAlerts",
    label: "Health factor alerts",
    description: "Get notified when your loan health factor drops below the warning threshold.",
  },
  {
    key: "repaymentReminders",
    label: "Repayment reminders",
    description: "Receive reminders before your repayment due date.",
  },
  {
    key: "liquidationWarnings",
    label: "Liquidation warnings",
    description: "Be alerted immediately if your collateral is at risk of liquidation.",
  },
];

export default function NotificationPreferences({ wallet = "anonymous" }: { wallet?: string }) {
  const { success, error: toastError } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    healthFactorAlerts: true,
    repaymentReminders: true,
    liquidationWarnings: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/v1/profile/settings?wallet=${encodeURIComponent(wallet)}`)
      .then((r) => r.json())
      .then((data: NotificationSettings) => setSettings(data))
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, [wallet]);

  async function toggle(key: keyof NotificationSettings) {
    const prev = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      const res = await fetch(
        `${API}/api/v1/profile/settings?wallet=${encodeURIComponent(wallet)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: next[key] }),
        }
      );
      if (!res.ok) throw new Error();
      const saved: NotificationSettings = await res.json();
      setSettings(saved);
      success("Notification preference saved.");
    } catch {
      setSettings(prev);
      toastError("Failed to save preference. Please try again.");
    }
  }

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-3">
        {TOGGLES.map((t) => (
          <div key={t.key} className="h-16 rounded-xl bg-brown/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <section aria-labelledby="notif-heading" className="space-y-4">
      <h2 id="notif-heading" className="text-lg font-semibold text-brown dark:text-cream-50">
        Notification Preferences
      </h2>

      <ul className="space-y-3" aria-label="Notification toggles">
        {TOGGLES.map(({ key, label, description }) => {
          const checked = settings[key];
          const toggleId = `toggle-${key}`;
          return (
            <li
              key={key}
              className="flex items-start justify-between gap-4 rounded-xl border border-brown/10 dark:border-cream-50/10 bg-white dark:bg-brown-900/40 px-4 py-3"
            >
              <div className="flex-1">
                <label
                  htmlFor={toggleId}
                  className="block text-sm font-medium text-brown-700 dark:text-cream-50 cursor-pointer"
                >
                  {label}
                </label>
                <p className="text-xs text-brown/50 dark:text-cream-50/50 mt-0.5">{description}</p>
              </div>

              <button
                id={toggleId}
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                  checked ? "bg-gold-600" : "bg-brown/20"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    checked ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

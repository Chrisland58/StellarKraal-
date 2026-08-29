"use client";

import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import HelpMenu from "@/components/HelpMenu";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingDemo() {
  const { showOnboarding, openOnboarding, closeOnboarding } = useOnboarding();
  const [resetTick, setResetTick] = useState(0);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brown-700">StellarKraal Onboarding Demo</h1>
          <button
            onClick={() => setHelpMenuOpen(true)}
            className="p-2 text-brown-600 hover:text-brown-700 transition"
            aria-label="Open help menu"
            aria-expanded={helpMenuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" />
            </svg>
          </button>
          <HelpMenu
            isOpen={helpMenuOpen}
            onClose={() => setHelpMenuOpen(false)}
            onShowOnboarding={openOnboarding}
          />
        </div>

        <div className="rounded-2xl bg-cream-50 p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-brown-700">Demo Features</h2>
          <ul className="space-y-2 text-brown-600">
            <li>3-step onboarding modal with illustrations</li>
            <li>Skip and dismiss functionality on every step</li>
            <li>Completion state persisted in localStorage</li>
            <li>Help menu to re-access onboarding</li>
            <li>Responsive design with StellarKraal branding</li>
          </ul>

          <div className="mt-6">
            <button
              onClick={openOnboarding}
              className="rounded-lg bg-brown-600 px-4 py-2 text-cream-50 transition hover:bg-brown-700"
            >
              Show Onboarding
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("stellarkraal_onboarding_completed");
                setResetTick((value) => value + 1);
              }}
              className="ml-3 rounded-lg bg-gold-600 px-4 py-2 text-cream-50 transition hover:bg-gold-700"
            >
              Reset Demo
            </button>
            <span className="sr-only">{resetTick}</span>
          </div>
        </div>

        <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';

interface ChecklistStep {
  id: string;
  label: string;
  completed: boolean;
}

const STORAGE_KEY = 'stellarkraal_onboarding_checklist';

interface OnboardingState {
  dismissed: boolean;
  steps: Record<string, boolean>;
}

function loadState(): OnboardingState {
  if (typeof window === 'undefined') return { dismissed: false, steps: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { dismissed: false, steps: {} };
    return JSON.parse(stored);
  } catch {
    return { dismissed: false, steps: {} };
  }
}

function saveState(state: OnboardingState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface Props {
  hasWallet: boolean;
  hasCollateral: boolean;
  hasLoan: boolean;
}

function CheckCircleIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XMarkIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function OnboardingChecklist({ hasWallet, hasCollateral, hasLoan }: Props) {
  const [state, setState] = useState<OnboardingState>(loadState);

  useEffect(() => {
    const newSteps = {
      wallet: hasWallet,
      collateral: hasCollateral,
      loan: hasLoan,
    };
    setState((prev) => {
      const updated = { ...prev, steps: newSteps };
      saveState(updated);
      return updated;
    });
  }, [hasWallet, hasCollateral, hasLoan]);

  const steps: ChecklistStep[] = [
    { id: 'wallet', label: 'Connect wallet', completed: state.steps.wallet ?? false },
    { id: 'collateral', label: 'Add collateral', completed: state.steps.collateral ?? false },
    { id: 'loan', label: 'Request loan', completed: state.steps.loan ?? false },
  ];

  const allComplete = steps.every((s) => s.completed);

  useEffect(() => {
    if (allComplete && !state.dismissed) {
      // Auto-dismiss when all steps are complete
      const timer = setTimeout(() => handleDismiss(), 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, state.dismissed]);

  function handleDismiss() {
    const updated = { ...state, dismissed: true };
    setState(updated);
    saveState(updated);
  }

  if (state.dismissed) return null;

  return (
    <div
      className="relative mb-6 rounded-2xl border border-gold-300 bg-gradient-to-br from-gold-50 to-cream-100 p-6 shadow-md dark:from-brown-800 dark:to-brown-900 dark:border-gold-600"
      role="region"
      aria-label="Getting started checklist"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-brown-500 hover:text-brown-700 transition"
        aria-label="Dismiss checklist"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      <h2 className="mb-4 text-xl font-bold text-brown-800 dark:text-cream-100">
        🚀 Getting Started
      </h2>
      <p className="mb-4 text-sm text-brown-600 dark:text-brown-300">
        Complete these steps to start using StellarKraal:
      </p>

      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircleIcon className="h-6 w-6 text-success motion-safe:animate-[ping_0.5s_ease-out]" />
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-brown-300 dark:border-brown-600" aria-hidden="true" />
              )}
            </div>
            <span
              className={`text-base font-medium ${
                step.completed
                  ? 'text-brown-700 line-through dark:text-brown-300'
                  : 'text-brown-900 dark:text-cream-100'
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>

      {allComplete && (
        <div
          className="mt-4 rounded-lg bg-success-light p-3 text-sm text-success-dark font-semibold motion-safe:animate-[fadeIn_0.6s_ease-out]"
          role="status"
        >
          ✅ All done! You're ready to use StellarKraal.
        </div>
      )}
    </div>
  );
}

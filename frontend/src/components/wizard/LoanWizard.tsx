"use client";
import { useState } from "react";
import { LoanWizardProvider, useWizard } from "@/context/LoanWizardContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import StepCollateral from "./steps/StepCollateral";
import StepAmount from "./steps/StepAmount";
import StepReview from "./steps/StepReview";
import StepConfirm from "./steps/StepConfirm";

const STEPS = [
  { number: 1, label: "Collateral" },
  { number: 2, label: "Amount" },
  { number: 3, label: "Review" },
  { number: 4, label: "Confirm" },
];

interface Props {
  walletAddress: string;
}

function WizardInner({ walletAddress }: Props) {
  const { step, prevStep } = useWizard();
  // Bumped on every retry so the ErrorBoundary's `key` changes and the
  // crashed step remounts cleanly, even when there's no previous step to
  // go back to (#522).
  const [retryKey, setRetryKey] = useState(0);

  function handleStepRetry() {
    setRetryKey((k) => k + 1);
    prevStep();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg mt-6 overflow-hidden">
      {/* Progress Header */}
      <div className="bg-cream border-b border-brown/10 px-6 pt-5 pb-4">
        {/* Step label */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brown/50">
            Loan Request
          </span>
          <span className="text-xs font-medium text-brown/60">
            Step {step} of {STEPS.length}
          </span>
        </div>

        {/* Step dots / track */}
        <div className="flex items-center gap-0">
          {STEPS.map(({ number, label }, i) => {
            const isCompleted = step > number;
            const isCurrent = step === number;
            return (
              <div key={number} className="flex items-center flex-1 last:flex-none">
                {/* Node */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-brown border-brown text-cream"
                        : isCurrent
                        ? "bg-gold border-gold text-brown"
                        : "bg-white border-brown/25 text-brown/40"
                    }`}
                  >
                    {isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      number
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium transition-colors ${
                      isCurrent ? "text-brown" : isCompleted ? "text-brown/60" : "text-brown/30"
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full overflow-hidden bg-brown/15">
                    <div
                      className="h-full bg-brown transition-all duration-500"
                      style={{ width: step > number ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content — each step is wrapped in its own ErrorBoundary (#522)
          so a crash in one step doesn't take down the whole wizard. Retry
          navigates back to the previous step (or, on step 1 where there is
          none, simply remounts the step for another attempt). */}
      <div className="p-6">
        {step === 1 && (
          <ErrorBoundary
            key={`collateral-${retryKey}`}
            section="Collateral"
            onRetry={handleStepRetry}
            retryLabel="↻ Try again"
          >
            <StepCollateral walletAddress={walletAddress} />
          </ErrorBoundary>
        )}
        {step === 2 && (
          <ErrorBoundary
            key={`amount-${retryKey}`}
            section="Amount"
            onRetry={handleStepRetry}
            retryLabel="← Back to previous step"
          >
            <StepAmount />
          </ErrorBoundary>
        )}
        {step === 3 && (
          <ErrorBoundary
            key={`review-${retryKey}`}
            section="Review"
            onRetry={handleStepRetry}
            retryLabel="← Back to previous step"
          >
            <StepReview />
          </ErrorBoundary>
        )}
        {step === 4 && (
          <ErrorBoundary
            key={`confirm-${retryKey}`}
            section="Confirm"
            onRetry={handleStepRetry}
            retryLabel="← Back to previous step"
          >
            <StepConfirm walletAddress={walletAddress} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

export default function LoanWizard({ walletAddress }: Props) {
  return (
    <LoanWizardProvider walletAddress={walletAddress}>
      <WizardInner walletAddress={walletAddress} />
    </LoanWizardProvider>
  );
}
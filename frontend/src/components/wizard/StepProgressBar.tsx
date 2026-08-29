"use client";

interface Props {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

/**
 * Standalone visual step progress bar for multi-step flows (e.g. LoanWizard),
 * showing current step out of total with an accessible progressbar role.
 */
export default function StepProgressBar({ currentStep, totalSteps, labels }: Props) {
  const percent = totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 text-xs font-medium text-brown/60 dark:text-cream/60">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        {labels?.[currentStep - 1] && <span>{labels[currentStep - 1]}</span>}
      </div>
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label="Loan request progress"
        className="h-2 w-full rounded-full bg-brown/15 dark:bg-cream/15 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-brown dark:bg-gold transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

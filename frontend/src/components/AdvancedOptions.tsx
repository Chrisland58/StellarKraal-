"use client";
/**
 * AdvancedOptions — Issue #1100
 *
 * Expandable "Advanced options" section for the loan request form.
 * - Collapsed by default
 * - Smooth height transition (CSS max-height technique)
 * - Keyboard accessible: Enter / Space to toggle
 * - Expanded state persisted via a React context so it survives
 *   wizard step navigation within the same page session
 */
import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  useEffect,
} from "react";

/* ─── Context: persist expanded state across wizard steps ──── */
interface AdvancedOptionsContextValue {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  values: AdvancedOptionValues;
  setValues: (v: AdvancedOptionValues) => void;
}

export interface AdvancedOptionValues {
  /** Custom interest rate (basis points, e.g. 500 = 5%) */
  interestRateBps: string;
  /** Loan extension option in days */
  extensionDays: string;
  /** Partial repayment schedule: minimum % per period */
  minRepaymentPct: string;
}

const DEFAULT_VALUES: AdvancedOptionValues = {
  interestRateBps: "",
  extensionDays: "",
  minRepaymentPct: "",
};

const AdvancedOptionsContext = createContext<AdvancedOptionsContextValue>({
  expanded: false,
  setExpanded: () => {},
  values: DEFAULT_VALUES,
  setValues: () => {},
});

/** Wrap the wizard / form in this provider to persist advanced options state */
export function AdvancedOptionsProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<AdvancedOptionValues>(DEFAULT_VALUES);
  return (
    <AdvancedOptionsContext.Provider
      value={{ expanded, setExpanded, values, setValues }}
    >
      {children}
    </AdvancedOptionsContext.Provider>
  );
}

export function useAdvancedOptions() {
  return useContext(AdvancedOptionsContext);
}

/* ─── UI component ──────────────────────────────────────────── */

interface Props {
  /** Called with current field values whenever any value changes */
  onChange?: (values: AdvancedOptionValues) => void;
}

export default function AdvancedOptions({ onChange }: Props) {
  const { expanded, setExpanded, values, setValues } = useAdvancedOptions();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  /* Measure content height for smooth animation */
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded]);

  function toggle() {
    setExpanded(!expanded);
  }

  function handleFieldChange(
    field: keyof AdvancedOptionValues,
    value: string
  ) {
    const next = { ...values, [field]: value };
    setValues(next);
    onChange?.(next);
  }

  return (
    <div className="border border-brown/20 rounded-xl overflow-hidden">
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        aria-expanded={expanded}
        aria-controls="advanced-options-panel"
        className="
          w-full flex items-center justify-between
          px-4 py-3 text-sm font-semibold text-brown
          bg-cream hover:bg-cream/60 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-gold
        "
      >
        <span className="flex items-center gap-2">
          {/* Gear icon */}
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Advanced options
        </span>

        {/* Chevron rotates on expand */}
        <svg
          aria-hidden="true"
          className={`w-4 h-4 text-brown/60 transition-transform duration-300 ${
            expanded ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible panel — smooth height animation */}
      <div
        id="advanced-options-panel"
        role="region"
        aria-label="Advanced loan options"
        ref={contentRef}
        style={{
          maxHeight: expanded ? `${contentHeight}px` : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="px-4 py-4 space-y-4 bg-white">
          {/* Custom interest rate */}
          <div>
            <label
              htmlFor="adv-interest-rate"
              className="block text-xs font-semibold text-brown/70 mb-1"
            >
              Custom interest rate (basis points)
            </label>
            <input
              id="adv-interest-rate"
              type="number"
              min={0}
              max={10000}
              placeholder="e.g. 500 = 5%"
              value={values.interestRateBps}
              onChange={(e) =>
                handleFieldChange("interestRateBps", e.target.value)
              }
              className="w-full border border-brown/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <p className="text-xs text-brown/40 mt-0.5">
              Leave blank to use the protocol default rate.
            </p>
          </div>

          {/* Extension days */}
          <div>
            <label
              htmlFor="adv-extension-days"
              className="block text-xs font-semibold text-brown/70 mb-1"
            >
              Loan extension option (days)
            </label>
            <input
              id="adv-extension-days"
              type="number"
              min={0}
              max={365}
              placeholder="e.g. 30"
              value={values.extensionDays}
              onChange={(e) =>
                handleFieldChange("extensionDays", e.target.value)
              }
              className="w-full border border-brown/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <p className="text-xs text-brown/40 mt-0.5">
              Adds an optional extension window to the loan term.
            </p>
          </div>

          {/* Minimum repayment percentage */}
          <div>
            <label
              htmlFor="adv-min-repayment"
              className="block text-xs font-semibold text-brown/70 mb-1"
            >
              Minimum repayment per period (%)
            </label>
            <input
              id="adv-min-repayment"
              type="number"
              min={1}
              max={100}
              placeholder="e.g. 10"
              value={values.minRepaymentPct}
              onChange={(e) =>
                handleFieldChange("minRepaymentPct", e.target.value)
              }
              className="w-full border border-brown/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <p className="text-xs text-brown/40 mt-0.5">
              Partial repayment schedule — minimum % of principal per payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

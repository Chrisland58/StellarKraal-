"use client";
import { useState } from "react";

interface Props {
  outstandingBalance: number;
  onChange: (amount: number) => void;
  initialAmount?: number;
}

/**
 * Additive replacement input for RepayPanel: a 0-100% slider of the
 * outstanding balance paired with a precise text input, kept in sync.
 */
export default function RepaySlider({ outstandingBalance, onChange, initialAmount = 0 }: Props) {
  const [amount, setAmount] = useState(initialAmount);

  const percent =
    outstandingBalance > 0 ? Math.min(100, Math.round((amount / outstandingBalance) * 100)) : 0;

  function updateFromPercent(pct: number) {
    const next = Math.round((pct / 100) * outstandingBalance);
    setAmount(next);
    onChange(next);
  }

  function updateFromAmount(value: string) {
    const parsed = Math.max(0, Math.min(outstandingBalance, parseInt(value) || 0));
    setAmount(parsed);
    onChange(parsed);
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-brown/60 dark:text-cream/60">
        <span>0%</span>
        <span aria-live="polite">{percent}% of balance</span>
        <span>100%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => updateFromPercent(parseInt(e.target.value))}
        aria-label="Repayment percentage of outstanding balance"
        className="w-full accent-gold"
      />
      <input
        type="number"
        min={0}
        max={outstandingBalance}
        value={amount}
        onChange={(e) => updateFromAmount(e.target.value)}
        aria-label="Precise repayment amount"
        placeholder="Amount (stroops)"
        className="w-full border border-brown/30 dark:border-gold/40 rounded-lg px-3 py-2 bg-white dark:bg-[#2A1A08] text-brown dark:text-cream placeholder:text-brown/40 dark:placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-gold"
      />
    </div>
  );
}

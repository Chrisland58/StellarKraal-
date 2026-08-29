'use client';
import { useState } from 'react';
import { formatFiat } from '@/lib/formatMoney';

interface Props {
  xlmAmount: string;
  onFiatChange: (fiatValue: string) => void;
  xlmToFiatRate?: number; // e.g. USD per XLM
  fiatSymbol?: string;
}

/**
 * Additive toggle for StepAmount allowing users to enter/view the loan
 * amount in a preferred fiat currency, converting to/from XLM automatically.
 */
export default function FiatAmountToggle({
  xlmAmount,
  onFiatChange,
  xlmToFiatRate = 0.11,
  fiatSymbol = 'USD',
}: Props) {
  const [mode, setMode] = useState<'XLM' | 'FIAT'>('XLM');
  const [fiatValue, setFiatValue] = useState('');

  function handleFiatInput(value: string) {
    setFiatValue(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && xlmToFiatRate > 0) {
      onFiatChange(String(Math.round(parsed / xlmToFiatRate)));
    }
  }

  const estimatedFiat =
    xlmAmount && !isNaN(parseFloat(xlmAmount))
      ? formatFiat(parseFloat(xlmAmount) * xlmToFiatRate, fiatSymbol)
      : formatFiat(0, fiatSymbol);

  return (
    <div className="mt-2 flex items-center gap-3 text-sm">
      <div
        role="group"
        aria-label="Amount currency"
        className="inline-flex rounded-lg border border-brown/25 dark:border-gold/30 overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setMode('XLM')}
          aria-pressed={mode === 'XLM'}
          className={`px-3 py-1.5 font-medium ${
            mode === 'XLM'
              ? 'bg-gold text-brown'
              : 'bg-white dark:bg-[#2A1A08] text-brown/60 dark:text-cream/60'
          }`}
        >
          XLM
        </button>
        <button
          type="button"
          onClick={() => setMode('FIAT')}
          aria-pressed={mode === 'FIAT'}
          className={`px-3 py-1.5 font-medium ${
            mode === 'FIAT'
              ? 'bg-gold text-brown'
              : 'bg-white dark:bg-[#2A1A08] text-brown/60 dark:text-cream/60'
          }`}
        >
          {fiatSymbol}
        </button>
      </div>

      {mode === 'FIAT' ? (
        <input
          type="number"
          min="0"
          value={fiatValue}
          onChange={(e) => handleFiatInput(e.target.value)}
          placeholder={`Amount in ${fiatSymbol}`}
          className="flex-1 border border-brown/30 dark:border-gold/40 rounded-lg px-3 py-1.5 bg-white dark:bg-[#2A1A08] text-brown dark:text-cream placeholder:text-brown/40 dark:placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-gold"
        />
      ) : (
        <span className="text-brown/50 dark:text-cream/50">≈ {estimatedFiat}</span>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useWizard } from '@/context/LoanWizardContext';
import { GlossaryTerm } from '@/components/GlossaryTerm';
import { Button } from '@/components/ui';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

const TERM_RATES: Record<string, string> = {
  '7': '2%',
  '30': '5%',
  '90': '12%',
  '180': '20%',
};

const ANIMAL_EMOJI: Record<string, string> = {
  cattle: '🐄',
  goat: '🐐',
  sheep: '🐑',
};

function AmountBreakdownTooltip({ principal, originationFee, estimatedFirstInterest }: { principal: number; originationFee: number; estimatedFirstInterest: number }) {
  const [open, setOpen] = useState(false);
  const { rates, convert } = useCurrencyConversion();
  const usdRate = rates?.USD ?? null;

  const formatXlm = (stroops: number) => `${(stroops / 1e7).toFixed(2)} XLM`;
  const formatFiat = (stroops: number) => {
    if (!usdRate) return null;
    const usd = (stroops / 1e7) * usdRate;
    return `$${usd.toFixed(2)} USD`;
  };

  const items = [
    { label: 'Principal', value: principal },
    { label: 'Origination Fee', value: originationFee },
    { label: 'Est. First Interest', value: estimatedFirstInterest },
  ];

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-label="Amount breakdown"
        aria-expanded={open}
        aria-describedby={open ? 'amount-breakdown-tooltip' : undefined}
        className="text-brown/50 hover:text-brown transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brown rounded"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div
          id="amount-breakdown-tooltip"
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-brown-dark text-sand-light text-sm rounded-lg shadow-lg"
        >
          <div className="font-semibold mb-2 text-white">Amount Breakdown</div>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="opacity-90">{item.label}</span>
                <div className="text-right">
                  <span className="font-mono">{formatXlm(item.value)}</span>
                  {formatFiat(item.value) && (
                    <span className="block text-xs opacity-75">{formatFiat(item.value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-solid border-t-brown-dark border-t-8 border-x-transparent border-x-8 border-b-0" aria-hidden="true" />
        </div>
      )}
    </span>
  );
}

export default function StepReview() {
  const { animalType, count, appraisedValue, loanAmount, loanTermDays, nextStep, prevStep } =
    useWizard();

  const [isDetailedView, setIsDetailedView] = useState(false);

  const rate = TERM_RATES[loanTermDays] || '5%';
  const rateNum = parseFloat(rate) / 100;
  const principal = parseInt(loanAmount || '0');
  const fee = Math.floor(principal * rateNum);
  const estimatedFirstInterest = Math.floor(principal * 0.01);
  const totalRepay = principal + fee;
  const healthFactor =
    loanAmount && appraisedValue
      ? (parseInt(appraisedValue) / principal / 1.5).toFixed(2)
      : '—';

  const rows = [
    {
      label: 'Collateral Type',
      value: `${ANIMAL_EMOJI[animalType]} ${animalType.charAt(0).toUpperCase() + animalType.slice(1)}`,
    },
    { label: 'Animal Count', value: count },
    { label: 'Appraised Value', value: `${parseInt(appraisedValue || '0').toLocaleString()} stroops` },
    { label: <GlossaryTerm termKey="loanAmount">Loan Amount</GlossaryTerm>, value: `${principal.toLocaleString()} stroops` },
    { label: 'Loan Term', value: `${loanTermDays} days` },
    { label: <GlossaryTerm termKey="feeRate">Fee Rate</GlossaryTerm>, value: rate },
    { label: 'Fee Amount', value: `${fee.toLocaleString()} stroops` },
    {
      label: (
        <span className="flex items-center">
          <GlossaryTerm termKey="repayment">Total to Repay</GlossaryTerm>
          <AmountBreakdownTooltip principal={principal} originationFee={fee} estimatedFirstInterest={estimatedFirstInterest} />
        </span>
      ),
      value: `${totalRepay.toLocaleString()} stroops`,
      bold: true,
    },
    {
      label: <GlossaryTerm termKey="healthFactor">Health Factor</GlossaryTerm>,
      value: healthFactor,
      bold: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown">Review Loan Terms</h2>
        <div className="flex items-center gap-3 mt-2 text-sm text-brown/70 bg-brown/5 inline-flex px-3 py-1.5 rounded-full border border-brown/10">
          <span className="flex items-center gap-1">
            ⏱ {isDetailedView ? 'About 2 minute read' : 'About 1 minute read'}
          </span>
          <span className="w-1 h-1 rounded-full bg-brown/30" />
          <span className="flex items-center gap-1">
            📊 {isDetailedView ? 'High complexity' : 'Low complexity'}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsDetailedView(!isDetailedView)}
          className="text-sm font-semibold text-gold hover:text-gold/80 transition underline underline-offset-2"
        >
          {isDetailedView ? 'Show simplified view' : 'Show full terms'}
        </button>
      </div>

      {!isDetailedView ? (
        <div className="bg-white border border-brown/20 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-brown mb-2 text-lg">Loan Summary</h3>
          <ul className="list-disc pl-5 text-brown/80 space-y-2 text-sm">
            <li>You are borrowing <strong>{principal.toLocaleString()} stroops</strong>.</li>
            <li>You will use <strong>{count} {animalType}s</strong> as collateral.</li>
            <li>The loan must be repaid in <strong>{loanTermDays} days</strong>.</li>
            <li>
              You will owe a total of <strong>{totalRepay.toLocaleString()} stroops</strong> including fees.
              <AmountBreakdownTooltip principal={principal} originationFee={fee} estimatedFirstInterest={estimatedFirstInterest} />
            </li>
            <li>If you fail to repay, your collateral may be seized.</li>
          </ul>
        </div>
      ) : (
        <div className="bg-white border border-brown/20 rounded-2xl overflow-hidden shadow-sm transition-all">
          {rows.map(({ label, value, bold }, i) => (
            <div
              key={typeof label === 'string' ? label : i}
              className={`flex justify-between items-center px-5 py-3.5 ${
                i !== rows.length - 1 ? 'border-b border-brown/10' : ''
              } ${bold ? 'bg-gold/5' : ''}`}
            >
              <span className={`text-sm ${bold ? 'font-semibold text-brown' : 'text-brown/60'}`}>
                {label}
              </span>
              <span className={`text-sm ${bold ? 'font-bold text-brown' : 'text-brown'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Risk warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
        <span className="text-amber-500 text-lg">⚠️</span>
        <p className="text-amber-700 text-sm">
          If the health factor drops below 1.0, your collateral may be liquidated. Monitor your
          position regularly.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={prevStep}>
          ← Back
        </Button>
        <Button className="flex-[2]" onClick={nextStep}>
          Confirm & Submit →
        </Button>
      </div>
    </div>
  );
}

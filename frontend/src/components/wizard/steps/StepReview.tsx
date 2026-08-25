'use client';
import { useState } from 'react';
import { useWizard } from '@/context/LoanWizardContext';
import { GlossaryTerm } from '@/components/GlossaryTerm';
import { Button } from '@/components/ui';

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

export default function StepReview() {
  const { animalType, count, appraisedValue, loanAmount, loanTermDays, nextStep, prevStep } =
    useWizard();
  
  const [isDetailedView, setIsDetailedView] = useState(false);

  const rate = TERM_RATES[loanTermDays] || '5%';
  const rateNum = parseFloat(rate) / 100;
  const fee = Math.floor(parseInt(loanAmount || '0') * rateNum);
  const totalRepay = parseInt(loanAmount || '0') + fee;
  const healthFactor =
    loanAmount && appraisedValue
      ? (parseInt(appraisedValue) / parseInt(loanAmount) / 1.5).toFixed(2)
      : '—';

  const rows = [
    {
      label: 'Collateral Type',
      value: `${ANIMAL_EMOJI[animalType]} ${animalType.charAt(0).toUpperCase() + animalType.slice(1)}`,
    },
    { label: 'Animal Count', value: count },
    { label: 'Appraised Value', value: `${parseInt(appraisedValue || '0').toLocaleString()} stroops` },
    { label: <GlossaryTerm termKey="loanAmount">Loan Amount</GlossaryTerm>, value: `${parseInt(loanAmount || '0').toLocaleString()} stroops` },
    { label: 'Loan Term', value: `${loanTermDays} days` },
    { label: <GlossaryTerm termKey="feeRate">Fee Rate</GlossaryTerm>, value: rate },
    { label: 'Fee Amount', value: `${fee.toLocaleString()} stroops` },
    { label: <GlossaryTerm termKey="repayment">Total to Repay</GlossaryTerm>, value: `${totalRepay.toLocaleString()} stroops`, bold: true },
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
          <span className="flex items-center gap-1">⏱ {isDetailedView ? 'About 2 minute read' : 'About 1 minute read'}</span>
          <span className="w-1 h-1 rounded-full bg-brown/30" />
          <span className="flex items-center gap-1">📊 {isDetailedView ? 'High complexity' : 'Low complexity'}</span>
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
            <li>You are borrowing <strong>{parseInt(loanAmount || '0').toLocaleString()} stroops</strong>.</li>
            <li>You will use <strong>{count} {animalType}s</strong> as collateral.</li>
            <li>The loan must be repaid in <strong>{loanTermDays} days</strong>.</li>
            <li>You will owe a total of <strong>{totalRepay.toLocaleString()} stroops</strong> including fees.</li>
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

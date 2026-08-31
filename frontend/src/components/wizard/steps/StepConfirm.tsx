'use client';
import { useState, useEffect } from 'react';
import { useWizard } from '@/context/LoanWizardContext';
import { useButtonState } from '@/hooks/useButtonState';
import { signTransaction } from '@/lib/freighterClient';
import { submitSignedXdr } from '@/lib/stellarUtils';
import { invalidateLoans } from '@/lib/api';
import { Button } from '@/components/ui';
import Spinner from '@/components/Spinner';
import XlmAmount from '@/components/XlmAmount';
import { useCurrencySettings } from '@/hooks/useCurrencySettings';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { formatXlmFromStroops } from '@/lib/formatMoney';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TERM_RATES: Record<string, string> = {
  '7': '2%',
  '30': '5%',
  '90': '12%',
  '180': '20%',
};

/** XLM amount above which we show the high-fee amber warning. */
const FEE_WARNING_THRESHOLD_XLM = 0.1;

interface Props {
  walletAddress: string;
}

export default function StepConfirm({ walletAddress }: Props) {
  const {
    animalType,
    count,
    collateralId,
    loanAmount,
    loanTermDays,
    error,
    setField,
    prevStep,
    reset,
    clearSavedProgress,
  } = useWizard();

  const [loanId, setLoanId] = useState<string | null>(null);
  const submitButton = useButtonState();

  // ── Fee estimation state ──────────────────────────────────────────────────
  const [feeXlm, setFeeXlm] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Currency conversion helpers (used for inline fiat display alongside XLM)
  const { enabled: currencyEnabled, currency } = useCurrencySettings();
  const { convert } = useCurrencyConversion();

  // Fetch fee estimate on mount (or whenever the loan parameters change)
  useEffect(() => {
    let cancelled = false;

    async function estimateFee() {
      setFeeLoading(true);
      setFeeError(null);
      setFeeXlm(null);

      try {
        const res = await fetch(`${API}/api/v1/loans/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collateral_id: parseInt(collateralId),
            amount: parseInt(loanAmount || '0'),
            term_days: parseInt(loanTermDays),
          }),
        });

        if (!res.ok) throw new Error('Estimate request failed');
        const data = await res.json();

        if (!cancelled) {
          setFeeXlm(typeof data.estimatedFee === 'number' ? data.estimatedFee : null);
        }
      } catch {
        if (!cancelled) {
          setFeeError('Unable to estimate fee');
        }
      } finally {
        if (!cancelled) {
          setFeeLoading(false);
        }
      }
    }

    estimateFee();

    return () => {
      cancelled = true;
    };
  }, [collateralId, loanAmount, loanTermDays]);

  // ── Origination fee / repayment totals (existing logic) ──────────────────
  const rate = TERM_RATES[loanTermDays] || '5%';
  const fee = Math.floor((parseInt(loanAmount || '0') * parseFloat(rate)) / 100);
  const totalRepay = parseInt(loanAmount || '0') + fee;

  // ── Submit handler (unchanged) ────────────────────────────────────────────
  async function handleSubmit() {
    submitButton.setLoading();
    setField('error', null);
    try {
      const res = await fetch(`${API}/api/loan/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower: walletAddress,
          collateral_id: parseInt(collateralId),
          amount: parseInt(loanAmount),
          term_days: parseInt(loanTermDays),
        }),
      });
      if (!res.ok) throw new Error('Loan request failed. Please try again.');
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || 'TESTNET',
      });
      const result = await submitSignedXdr(signedTxXdr);
      setLoanId(String(result));
      // New loan created — drop cached loan lists so they revalidate.
      invalidateLoans();
      // Loan is submitted; stop offering to restore this now-completed
      // draft on a future visit (#523). The in-memory values stay put so
      // the success screen below can still show what was submitted.
      clearSavedProgress();
      submitButton.setSuccess();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      setField('error', message);
      submitButton.setError();
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (loanId) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">
          ✅
        </div>
        <div>
          <h2 className="text-2xl font-bold text-brown">Loan Disbursed!</h2>
          <p className="text-brown/60 mt-2 text-sm">
            Your loan has been approved and disbursed to your wallet.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-left">
          <p className="text-sm text-green-700 font-medium">Loan ID</p>
          <p className="font-mono text-brown break-all mt-1">{loanId}</p>
        </div>
        <div className="bg-white border border-brown/20 rounded-xl px-5 py-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brown/60">Amount received</span>
            <span className="font-semibold text-brown">
              {formatXlmFromStroops(parseInt(loanAmount))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brown/60">Due in</span>
            <span className="font-semibold text-brown">{loanTermDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brown/60">Total to repay</span>
            <span className="font-bold text-brown">{formatXlmFromStroops(totalRepay)}</span>
          </div>
        </div>
        <Button variant="ghost" fullWidth onClick={reset}>
          Request Another Loan
        </Button>
      </div>
    );
  }

  // ── Helper: fiat conversion of the estimated fee ──────────────────────────
  const fiatFee =
    currencyEnabled && feeXlm !== null ? convert(feeXlm, currency) : null;

  const CURRENCY_SYMBOLS: Record<string, string> = {
    KES: 'KSh',
    NGN: '₦',
    GHS: 'GH₵',
    USD: '$',
  };

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown">Final Summary</h2>
        <p className="text-brown/60 mt-1 text-sm">
          This is a read-only review. Please check every detail before signing — it cannot be
          changed once submitted.
        </p>
      </div>

      {/* Read-only summary card */}
      <div
        className="bg-cream border-2 border-brown/20 rounded-2xl p-5 space-y-3"
        aria-label="Loan summary"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-brown/50 uppercase tracking-wider font-medium">
              You're borrowing
            </p>
            <p className="text-3xl font-bold text-brown mt-0.5">
              {formatXlmFromStroops(parseInt(loanAmount))}
            </p>
          </div>
          <div className="bg-brown/10 rounded-xl px-3 py-1.5 text-right">
            <p className="text-xs text-brown/50">Collateral</p>
            <p className="text-sm font-semibold text-brown">
              {count} {animalType}(s)
            </p>
          </div>
        </div>

        <dl className="border-t border-brown/10 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-brown/50">Collateral ID</dt>
            <dd className="font-medium text-brown font-mono">{collateralId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown/50">Borrower wallet</dt>
            <dd
              className="font-medium text-brown font-mono truncate max-w-[60%]"
              title={walletAddress}
            >
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown/50">Loan term</dt>
            <dd className="font-medium text-brown">{loanTermDays} days</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown/50">Interest rate</dt>
            <dd className="font-medium text-brown">{rate}</dd>
          </div>
        </dl>

        <div className="border-t border-brown/10 pt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-brown/50">Term</p>
            <p className="font-semibold text-brown">{loanTermDays}d</p>
          </div>
          <div>
            <p className="text-xs text-brown/50">Fee</p>
            <p className="font-semibold text-brown">{formatXlmFromStroops(fee)}</p>
          </div>
          <div>
            <p className="text-xs text-brown/50">Repay total</p>
            <p className="font-semibold text-brown">{formatXlmFromStroops(totalRepay)}</p>
          </div>
        </div>
      </div>

      {/* ── Estimated network fee ─────────────────────────────────────────── */}
      <div className="bg-white border border-brown/20 rounded-xl px-4 py-3">
        <p className="text-xs text-brown/50 uppercase tracking-wider font-medium mb-1">
          Estimated network fee
        </p>

        {feeLoading && (
          <div className="flex items-center gap-2 text-brown/60 text-sm" data-testid="fee-spinner">
            <Spinner className="h-4 w-4" label="Fetching fee estimate" />
            <span>Fetching fee estimate…</span>
          </div>
        )}

        {!feeLoading && feeError && (
          <p className="text-red-600 text-sm" data-testid="fee-error">
            {feeError}
          </p>
        )}

        {!feeLoading && feeXlm !== null && (
          <p className="text-brown font-semibold text-sm" data-testid="fee-amount">
            <XlmAmount xlm={feeXlm} />
            {currencyEnabled && fiatFee !== null && (
              <span className="text-brown/60 font-normal ml-1">
                ({CURRENCY_SYMBOLS[currency] ?? ''}{fiatFee.toLocaleString(undefined, { maximumFractionDigits: 2 })})
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── High-fee warning ─────────────────────────────────────────────── */}
      {feeXlm !== null && feeXlm > FEE_WARNING_THRESHOLD_XLM && (
        <div
          className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3"
          data-testid="fee-warning"
          role="alert"
        >
          <span className="text-amber-500 text-lg" aria-hidden="true">⚠️</span>
          <p className="text-amber-700 text-sm">
            The estimated network fee is unusually high ({feeXlm} XLM). Please review before
            submitting.
          </p>
        </div>
      )}

      {/* Wallet note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <span className="text-blue-500 text-lg" aria-hidden="true">🔐</span>
        <p className="text-blue-700 text-sm">
          Clicking submit will open Freighter to sign the transaction. Make sure your wallet is
          unlocked.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={prevStep}
          disabled={submitButton.state === 'loading'}
        >
          ← Back
        </Button>
        <Button
          variant="secondary"
          className="flex-[2]"
          onClick={handleSubmit}
          state={submitButton.state}
        >
          🚀 Submit Loan Request
        </Button>
      </div>
    </div>
  );
}

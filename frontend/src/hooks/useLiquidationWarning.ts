'use client';
import { useEffect, useState, useCallback } from 'react';
import { AtRiskLoan } from '@/components/LiquidationWarningModal';

/** Health factor threshold in bps below which we warn (1.2x = 12_000 bps). */
const WARNING_THRESHOLD_BPS = 12_000;
const DISMISS_KEY = 'liquidation_warning_dismissed_at';
const DISMISS_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface LoanWithHealth {
  id: string;
  health_factor?: number | null;
  status?: string;
}

/**
 * Returns the list of at-risk loans (health factor < 1.2x) and whether the
 * modal should be shown. Respects a 1-hour localStorage dismiss window.
 */
export function useLiquidationWarning(loans: LoanWithHealth[]) {
  const [dismissed, setDismissed] = useState(false);

  // Hydrate dismissed state from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const dismissedAt = parseInt(raw, 10);
        if (!isNaN(dismissedAt) && Date.now() - dismissedAt < DISMISS_DURATION_MS) {
          setDismissed(true);
        } else {
          // Expired — remove stale entry
          localStorage.removeItem(DISMISS_KEY);
        }
      }
    } catch {
      // localStorage unavailable (SSR / private mode) — ignore
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  const atRiskLoans: AtRiskLoan[] = loans
    .filter(
      (loan) =>
        loan.health_factor != null &&
        loan.health_factor < WARNING_THRESHOLD_BPS &&
        loan.status !== 'repaid' &&
        loan.status !== 'liquidated',
    )
    .map((loan) => ({
      id: loan.id,
      healthFactor: loan.health_factor as number,
    }));

  const shouldShow = !dismissed && atRiskLoans.length > 0;

  return { shouldShow, atRiskLoans, dismiss };
}

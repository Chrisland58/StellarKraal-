'use client';
import useSWR from 'swr';
import { API, fetcher } from '@/lib/api';

/** Health factor threshold below which a loan is considered at risk. */
export const AT_RISK_THRESHOLD = 1.2;

/** Polling interval: check for at-risk loans every 60 s while the page is open. */
const POLL_INTERVAL_MS = 60_000;

interface LoanWithHealth {
  id: string;
  borrower: string;
  amount: number;
  status: string;
  createdAt: string;
  /** Health factor returned by the API when included in the loans list. */
  health_factor?: number;
}

interface LoansResponse {
  data?: LoanWithHealth[];
}

/**
 * useAtRiskLoans — #803
 *
 * Fetches all active loans and returns the count of those whose
 * `health_factor` is below {@link AT_RISK_THRESHOLD} (1.2).
 *
 * The hook polls every 60 s so the badge stays accurate without a hard refresh.
 * It is designed to be called at the Navbar level so any child that imports
 * the hook benefits from the shared SWR cache with no extra requests.
 *
 * @returns `{ atRiskCount, atRiskLoans, isLoading, error }`
 */
export function useAtRiskLoans() {
  const { data, error, isLoading } = useSWR<LoanWithHealth[] | LoansResponse>(
    `${API}/api/loans`,
    fetcher,
    { refreshInterval: POLL_INTERVAL_MS, revalidateOnFocus: true }
  );

  const allLoans: LoanWithHealth[] = Array.isArray(data)
    ? data
    : Array.isArray((data as LoansResponse)?.data)
    ? (data as LoansResponse).data!
    : [];

  const atRiskLoans = allLoans.filter(
    (loan) =>
      loan.status === 'active' &&
      typeof loan.health_factor === 'number' &&
      loan.health_factor < AT_RISK_THRESHOLD
  );

  return {
    atRiskCount: atRiskLoans.length,
    atRiskLoans,
    isLoading,
    error: error ? (error as Error).message : null,
  };
}

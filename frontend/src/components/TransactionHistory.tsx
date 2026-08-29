'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { EmptyTransactionsIllustration } from './illustrations';
import Card from '@/components/Card';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { formatXlmFromStroops } from '@/lib/formatMoney';

interface Transaction {
  id: number;
  loan_id: number;
  type?: string;
  amount: number;
  status?: string;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Single transaction row for ≥640 px table layout */
function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <tr className="border-b border-brown-100 last:border-0">
      <td className="py-2 pr-4 text-sm text-brown-600">{tx.type ?? 'Repayment'}</td>
      <td className="py-2 pr-4 text-sm text-brown-600 font-mono">
        {formatXlmFromStroops(tx.amount)}
      </td>
      <td className="py-2 pr-4 text-sm text-brown-600">
        {new Date(tx.created_at).toLocaleDateString()}
      </td>
      <td className="py-2 text-sm">
        <StatusBadge status={tx.status} />
      </td>
    </tr>
  );
}

/** Single transaction card for <640 px mobile layout */
function TransactionCard({ tx }: { tx: Transaction }) {
  return (
    <li className="rounded-xl border border-brown-100 bg-cream-100 p-4 shadow-sm dark:bg-brown-800 dark:border-brown-700">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <dt className="text-xs font-medium text-brown-500 dark:text-brown-300 uppercase tracking-wide">
            Type
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-brown-700 dark:text-cream-200">
            {tx.type ?? 'Repayment'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-brown-500 dark:text-brown-300 uppercase tracking-wide">
            Amount
          </dt>
          <dd className="mt-0.5 text-sm font-mono text-brown-700 dark:text-cream-200">
            {formatXlmFromStroops(tx.amount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-brown-500 dark:text-brown-300 uppercase tracking-wide">
            Date
          </dt>
          <dd className="mt-0.5 text-sm text-brown-700 dark:text-cream-200">
            {new Date(tx.created_at).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-brown-500 dark:text-brown-300 uppercase tracking-wide">
            Status
          </dt>
          <dd className="mt-0.5">
            <StatusBadge status={tx.status} />
          </dd>
        </div>
      </dl>
    </li>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? 'completed';
  const styles: Record<string, string> = {
    completed: 'bg-success-light text-success-dark',
    pending: 'bg-warning-light text-warning-dark',
    failed: 'bg-error-light text-error-dark',
  };
  const cls = styles[s.toLowerCase()] ?? styles.completed;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {s}
    </span>
  );
}

export default function TransactionHistory({ walletAddress }: { walletAddress: string }) {
  useScrollPosition();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(() => {
    setLoaded(false);
    setError(null);
    fetch(`${API}/api/transactions?borrower=${walletAddress}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then((body) => {
        setTransactions(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load transactions');
        setTransactions([]);
      })
      .finally(() => setLoaded(true));
  }, [walletAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (!loaded) return null;

  if (error) {
    return (
      <Card
        className="mb-4"
        header={<h2 className="text-xl font-semibold text-brown-700">Transactions</h2>}
      >
        <ErrorState message={error} onRetry={fetchTransactions} />
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card
        className="mb-4"
        header={<h2 className="text-xl font-semibold text-brown-700">Transactions</h2>}
      >
        <EmptyState
          illustration={<EmptyTransactionsIllustration />}
          message="No transactions yet"
          ctaLabel="View Loans"
          onCta={() => router.push('/dashboard')}
        />
      </Card>
    );
  }

  const { page, limit, totalPages, setPage, setLimit, slice } = usePagination(transactions.length);
  const paginated = slice(transactions);

  return (
    <Card
      className="mb-4"
      header={<h2 className="text-xl font-semibold text-brown-700">Transactions</h2>}
    >
      {/* Mobile: card list (< 640 px) */}
      <ul className="flex flex-col gap-3 sm:hidden" aria-label="Transaction list">
        {paginated.map((tx) => (
          <TransactionCard key={tx.id} tx={tx} />
        ))}
      </ul>

      {/* Desktop: table (≥ 640 px) — sticky header within a scrollable container */}
      <div
        className="hidden sm:block overflow-auto max-h-[28rem]"
        role="region"
        aria-label="Transaction table — scroll to see more rows"
      >
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10">
            {/*
             * The background must be opaque so rows scrolling underneath
             * don't bleed through. We match the Card background for both
             * light (white / cream-50) and dark (stone-800) modes.
             */}
            <tr
              className="border-b border-brown-200 dark:border-stone-600 text-left
                           bg-white dark:bg-stone-800"
            >
              <th
                scope="col"
                className="w-1/4 py-3 pr-4 text-xs font-semibold uppercase tracking-wide
                           text-brown-500 dark:text-stone-400"
              >
                Type
              </th>
              <th
                scope="col"
                className="w-1/4 py-3 pr-4 text-xs font-semibold uppercase tracking-wide
                           text-brown-500 dark:text-stone-400"
              >
                Amount
              </th>
              <th
                scope="col"
                className="w-1/4 py-3 pr-4 text-xs font-semibold uppercase tracking-wide
                           text-brown-500 dark:text-stone-400"
              >
                Date
              </th>
              <th
                scope="col"
                className="w-1/4 py-3 text-xs font-semibold uppercase tracking-wide
                           text-brown-500 dark:text-stone-400"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </Card>
  );
}

"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import SearchFilterBar from "@/components/SearchFilterBar";
import PageTransition from "@/components/PageTransition";
import Card from "@/components/Card";
import { badgeVariants } from "@/lib/animations";
import { useScrollPosition } from "@/hooks/useScrollPosition";

interface Loan {
  id: string;
  borrower: string;
  amount: number;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['active', 'repaid', 'liquidated', 'pending'];
const TYPE_OPTIONS: string[] = [];
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Maps loan status to design-token badge classes (WCAG AA compliant). */
function statusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-success-light text-success-dark";
    case "repaid":
      return "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300";
    case "liquidated":
      return "bg-error-light text-error-dark";
    default:
      return "bg-brown-100 text-brown-600 dark:bg-brown-700 dark:text-brown-300";
  }
}

/** Inline status badge rendered inside the Card `badge` slot. */
function LoanStatusBadge({ status, reduced }: { status: string; reduced: boolean | null }) {
  return (
    <motion.span
      key={status}
      variants={reduced ? undefined : badgeVariants}
      initial="initial"
      animate="animate"
      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadgeClasses(status)}`}
    >
      {status}
    </motion.span>
  );
}

function LoanListContent() {
  const searchParams = useSearchParams();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/loans`)
      .then((r) => r.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  const q = (searchParams.get('q') ?? '').toLowerCase();
  const statuses = searchParams.getAll('status');

  const filtered = loans.filter((loan) => {
    const matchesQuery =
      !q ||
      loan.id.toLowerCase().includes(q) ||
      loan.borrower.toLowerCase().includes(q) ||
      loan.status.toLowerCase().includes(q);
    const matchesStatus = statuses.length === 0 || statuses.includes(loan.status);
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <SearchFilterBar
        statusOptions={STATUS_OPTIONS}
        typeOptions={TYPE_OPTIONS}
        searchPlaceholder="Search by loan ID, borrower, or status…"
      />
      {loading ? (
        <p className="text-brown/60 text-sm" role="status" aria-live="polite">
          Loading…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/60 text-sm" role="status" aria-live="polite">
          No loans match your filters.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Loans list">
          {filtered.map((loan) => (
            <li key={loan.id}>
              <Card
                title={`Loan #${loan.id}`}
                subtitle={loan.borrower}
                badge={<LoanStatusBadge status={loan.status} reduced={reduced} />}
                action={
                  <span className="text-sm font-medium text-brown-700 dark:text-cream-100">
                    {loan.amount.toLocaleString()} XLM
                  </span>
                }
                aria-label={`Loan ${loan.id}, ${loan.status}, ${loan.amount.toLocaleString()} XLM`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LoansListClient() {
  useScrollPosition();

  return (
    <PageTransition>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-brown mb-6">Loans</h1>
        <Suspense fallback={<p className="text-brown/60 text-sm">Loading…</p>}>
          <LoanListContent />
        </Suspense>
      </main>
    </PageTransition>
  );
}

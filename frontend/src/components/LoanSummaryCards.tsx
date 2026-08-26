'use client';

import AnimatedCounter from '@/components/AnimatedCounter';
import Card from '@/components/Card';
import { formatXlm } from '@/lib/formatMoney';

interface LoanSummary {
  /** Total loan principal in base units. */
  totalPrincipal: number;
  /** Outstanding balance in base units. */
  outstanding: number;
  /** Total interest accrued in base units. */
  interestAccrued: number;
  /** Number of active loans. */
  activeLoanCount: number;
}

interface LoanSummaryCardsProps {
  summary: LoanSummary;
}

function formatAmount(n: number): string {
  return formatXlm(n / 1_000_000); // assume base units are micro-XLM
}

const METRICS: {
  key: keyof LoanSummary;
  label: string;
  formatter?: (n: number) => string;
  ariaLabel: string;
}[] = [
  {
    key: 'totalPrincipal',
    label: 'Total Principal',
    formatter: formatAmount,
    ariaLabel: 'Total principal in XLM',
  },
  {
    key: 'outstanding',
    label: 'Outstanding Balance',
    formatter: formatAmount,
    ariaLabel: 'Outstanding balance in XLM',
  },
  {
    key: 'interestAccrued',
    label: 'Interest Accrued',
    formatter: formatAmount,
    ariaLabel: 'Total interest accrued in XLM',
  },
  {
    key: 'activeLoanCount',
    label: 'Active Loans',
    formatter: (n) => n.toLocaleString(),
    ariaLabel: 'Number of active loans',
  },
];

/**
 * LoanSummaryCards renders a row of metric cards for loan portfolio data.
 * Each numeric value animates from 0 to its target on mount, and re-animates
 * when the underlying data changes. The animation is disabled when the user
 * has `prefers-reduced-motion` set.
 */
export default function LoanSummaryCards({ summary }: LoanSummaryCardsProps) {
  return (
    <section aria-label="Loan summary">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map(({ key, label, formatter, ariaLabel }) => (
          <Card key={key}>
            <p className="text-xs font-medium uppercase tracking-wide text-brown/60 dark:text-brown-300/70 mb-1">
              {label}
            </p>
            <AnimatedCounter
              value={summary[key]}
              formatter={formatter}
              duration={1000}
              aria-label={ariaLabel}
              className="text-2xl font-bold text-brown dark:text-cream-50"
            />
          </Card>
        ))}
      </div>
    </section>
  );
}

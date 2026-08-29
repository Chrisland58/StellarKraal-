"use client";

import Skeleton from "./Skeleton";

/**
 * SkeletonLoansPage — page-level loading placeholder for the Loans list.
 *
 * Mirrors the LoansListClient layout: page heading, search/filter bar,
 * and a list of loan-row skeletons (ID, borrower, amount, status badge).
 */
export default function SkeletonLoansPage() {
  return (
    <main
      className="max-w-3xl mx-auto px-4 py-10"
      aria-busy="true"
      aria-label="Loading loans"
    >
      {/* ── Page heading ── */}
      <Skeleton className="h-9 w-24 mb-6" />

      {/* ── Search / filter bar ── */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* ── Loan rows ── */}
      <ul className="space-y-3" aria-label="Loading loan items">
        {[...Array(5)].map((_, i) => (
          <li
            key={i}
            className="bg-white dark:bg-brown-900 rounded-xl p-4 shadow-sm border border-brown/10 flex justify-between items-center"
            aria-hidden="true"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-44" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

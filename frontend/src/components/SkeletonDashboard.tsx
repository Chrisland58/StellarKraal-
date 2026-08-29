"use client";

import Skeleton from "./Skeleton";

/**
 * SkeletonDashboard — page-level loading placeholder for the Dashboard.
 *
 * Matches the Dashboard layout: header row, 2-column card grid, repay panel,
 * transaction history strip, and health-factor card.
 * Uses `animate-pulse` (via the `skeleton-shimmer` class on each Skeleton)
 * so all pieces pulse in sync.
 * aria-busy + aria-label make the region screen-reader friendly.
 * aria-hidden on decorative dividers keeps the AT tree clean.
 */
export default function SkeletonDashboard() {
  return (
    <main
      className="mx-auto max-w-6xl px-4 py-10"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* ── Header row ── */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* ── Wallet connect bar ── */}
      <Skeleton className="h-12 w-full rounded-xl mb-6" />

      {/* ── 2-column card grid ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Collateral card */}
        <div className="rounded-2xl bg-white dark:bg-brown-900 p-6 shadow space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        {/* Loan repayment calculator */}
        <div className="rounded-2xl bg-white dark:bg-brown-900 p-6 shadow space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* ── Repay panel ── */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-brown-900 p-6 shadow space-y-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* ── Transaction history ── */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-brown-900 p-6 shadow space-y-3">
        <Skeleton className="h-6 w-44" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* ── Health factor card ── */}
      <div className="mt-8 rounded-2xl bg-white dark:bg-brown-900 p-6 shadow space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
    </main>
  );
}

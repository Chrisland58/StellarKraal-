"use client";

import Skeleton from "./Skeleton";

/**
 * SkeletonCollateralPage — page-level loading placeholder for the Collateral list.
 *
 * Mirrors the CollateralListClient layout: page heading, search/filter bar,
 * and a list of collateral-row skeletons (animal type, owner, value, ID).
 */
export default function SkeletonCollateralPage() {
  return (
    <main
      className="max-w-3xl mx-auto px-4 py-10"
      aria-busy="true"
      aria-label="Loading collateral"
    >
      {/* ── Page heading ── */}
      <Skeleton className="h-9 w-32 mb-6" />

      {/* ── Search / filter bar ── */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* ── Collateral rows ── */}
      <ul className="space-y-3" aria-label="Loading collateral items">
        {[...Array(5)].map((_, i) => (
          <li
            key={i}
            className="bg-white dark:bg-brown-900 rounded-xl p-4 shadow-sm border border-brown/10 flex justify-between items-center"
            aria-hidden="true"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

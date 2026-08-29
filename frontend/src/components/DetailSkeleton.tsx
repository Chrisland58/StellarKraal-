import Skeleton from "./Skeleton";

/** Loading placeholder matching CollateralDetailPage's layout. */
export default function DetailSkeleton() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10" aria-busy="true" aria-label="Loading collateral details">
      <Skeleton className="h-4 w-32 mb-6" />

      {/* Animal profile */}
      <div className="bg-white dark:bg-brown-800 rounded-2xl p-6 shadow mb-6 flex gap-6 items-start">
        <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-20" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </div>

      {/* Current appraised value */}
      <div className="bg-gold/10 border border-gold/30 rounded-2xl p-6 shadow mb-6 text-center space-y-2">
        <Skeleton className="h-3 w-40 mx-auto" />
        <Skeleton className="h-9 w-48 mx-auto" />
      </div>

      {/* Appraisal history */}
      <div className="bg-white dark:bg-brown-800 rounded-2xl p-6 shadow space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>

      {/* Price history chart */}
      <div className="mt-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </main>
  );
}

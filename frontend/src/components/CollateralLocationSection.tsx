/**
 * CollateralLocationSection — Issue #568
 *
 * Renders a "Location (coming soon)" placeholder section on CollateralDetailPage.
 * Hidden when no location data exists on the record.
 * Will be wired to a real map in a future iteration.
 *
 * Acceptance criteria:
 *  ✓ Section renders with a placeholder map image / skeleton
 *  ✓ Labelled "Location (coming soon)"
 *  ✓ Hidden if no location data exists
 *  ✓ Accessible: h2 heading (follows the page h1)
 */
"use client";

interface Props {
  /** Optional location string. Section is hidden when absent or null. */
  location?: string | null;
}

export default function CollateralLocationSection({ location }: Props) {
  // Hidden when there is no location data at all
  if (location == null) return null;

  return (
    <section
      aria-labelledby="location-section-heading"
      className="mt-6 bg-white dark:bg-[var(--color-bg-card)] rounded-2xl p-6 shadow"
    >
      <h2
        id="location-section-heading"
        className="text-lg font-semibold text-brown dark:text-[var(--color-text)] mb-4 flex items-center gap-2"
      >
        <span aria-hidden="true">📍</span>
        Location{" "}
        <span className="text-sm font-normal text-brown/50 dark:text-[var(--color-text-muted)]">
          (coming soon)
        </span>
      </h2>

      {/* Placeholder map skeleton */}
      <div
        role="img"
        aria-label="Map placeholder — location feature coming soon"
        className="relative w-full h-40 rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-skeleton-base, #e8ddd0)" }}
      >
        {/* Subtle animated shimmer */}
        <div
          className="absolute inset-0 animate-pulse opacity-50"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--color-skeleton-shine, #f5ede0) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        {/* Centred icon + label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          aria-hidden="true"
        >
          <span className="text-4xl">🗺️</span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-muted, #8B5A1F)" }}
          >
            Map coming soon
          </span>
        </div>
      </div>

      {/* Display the raw location string when one is provided */}
      {location && (
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--color-text-muted, #8B5A1F)" }}
        >
          {location}
        </p>
      )}
    </section>
  );
}

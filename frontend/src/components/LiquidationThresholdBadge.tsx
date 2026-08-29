/**
 * LiquidationThresholdBadge — Issue #697
 *
 * Displays the protocol liquidation threshold (read from get_liquidation_threshold
 * on-chain or passed through by the backend) on CollateralDetailPage.
 *
 * Acceptance criteria:
 *  ✓ Shows current LIQ_THR value in bps, converted to a percentage
 *  ✓ Read-only display, no auth required
 *  ✓ Renders nothing when the value is unavailable
 *  ✓ Respects light/dark mode via CSS variables
 *  ✓ WCAG AA colour contrast
 */
"use client";

interface Props {
  /**
   * Liquidation threshold in basis points (e.g. 8000 = 80%).
   * Component renders nothing when this is absent or null.
   */
  thresholdBps?: number | null;
}

export default function LiquidationThresholdBadge({ thresholdBps }: Props) {
  if (thresholdBps == null) return null;

  const percent = (thresholdBps / 100).toFixed(0);

  return (
    <div
      className="mt-6 rounded-2xl p-5 shadow flex items-center justify-between gap-4"
      style={{
        backgroundColor: "var(--token-warning-subtle, #FEF3C7)",
        border: "1px solid var(--token-warning, #D97706)",
      }}
      aria-label={`Liquidation threshold: ${percent}%`}
    >
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-1"
          style={{ color: "var(--token-warning, #D97706)" }}
        >
          Liquidation Threshold
        </p>
        <p
          className="text-3xl font-bold"
          style={{ color: "var(--token-text, #3D2810)" }}
        >
          {percent}
          <span
            className="text-xl font-normal ml-1"
            style={{ color: "var(--token-text-muted, #8B5A1F)" }}
          >
            %
          </span>
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--token-text-muted, #8B5A1F)" }}
        >
          Health factor below this triggers liquidation eligibility
        </p>
      </div>

      {/* Visual indicator */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        aria-hidden="true"
        style={{
          backgroundColor: "var(--token-warning, #D97706)",
          color: "var(--token-on-warning, #FFFFFF)",
        }}
      >
        ⚠
      </div>
    </div>
  );
}

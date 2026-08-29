/**
 * Interest rate model — piecewise linear jump-rate model.
 * Matches the formula documented in docs/protocol/interest-rate-model.md.
 *
 * All rates and utilization are expressed in basis points (0–10_000).
 */

export interface InterestRateModel {
  base_rate_bps: number;
  slope1_bps: number;
  slope2_bps: number;
  kink_bps: number;
}

/** Default model parameters (see docs/protocol/interest-rate-model.md). */
export const DEFAULT_MODEL: InterestRateModel = {
  base_rate_bps: 200,   // 2%
  slope1_bps: 500,      // 5%
  slope2_bps: 4500,     // 45%
  kink_bps: 8000,       // 80%
};

const BPS = 10_000;

/**
 * Calculate the annualised interest rate in basis points for a given utilization.
 *
 * @param utilization_bps - Utilization rate in basis points (0–10_000).
 * @param model - Interest rate model parameters. Defaults to {@link DEFAULT_MODEL}.
 * @returns Interest rate in basis points.
 * @throws {RangeError} if utilization_bps is outside [0, 10_000].
 */
export function calcInterestRate(
  utilization_bps: number,
  model: InterestRateModel = DEFAULT_MODEL,
): number {
  if (utilization_bps < 0 || utilization_bps > BPS) {
    throw new RangeError(`utilization_bps must be in [0, 10000], got ${utilization_bps}`);
  }
  const { base_rate_bps, slope1_bps, slope2_bps, kink_bps } = model;
  if (utilization_bps <= kink_bps) {
    return base_rate_bps + Math.floor((slope1_bps * utilization_bps) / BPS);
  }
  return (
    base_rate_bps +
    Math.floor((slope1_bps * kink_bps) / BPS) +
    Math.floor((slope2_bps * (utilization_bps - kink_bps)) / BPS)
  );
}

/**
 * Compute utilization rate in basis points.
 *
 * @param total_borrowed - Sum of all outstanding loan amounts.
 * @param total_liquidity - Total available liquidity in the protocol.
 * @returns Utilization in basis points (0–10_000), or 0 when liquidity is zero.
 */
export function calcUtilization(total_borrowed: number, total_liquidity: number): number {
  if (total_liquidity <= 0) return 0;
  return Math.min(Math.floor((total_borrowed * BPS) / total_liquidity), BPS);
}

/**
 * Accrue simple interest over a period.
 *
 * @param principal - Loan principal.
 * @param rate_bps - Annual interest rate in basis points.
 * @param elapsed_ms - Elapsed time in milliseconds.
 * @returns Interest accrued (truncated to integer).
 */
export function accrueSimpleInterest(
  principal: number,
  rate_bps: number,
  elapsed_ms: number,
): number {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  return Math.floor((principal * rate_bps * elapsed_ms) / (BPS * MS_PER_YEAR));
}

/**
 * Accrue compound interest over a period (per-second compounding).
 *
 * @param principal - Loan principal.
 * @param rate_bps - Annual interest rate in basis points.
 * @param elapsed_ms - Elapsed time in milliseconds.
 * @returns Total amount owed after compounding (truncated to integer).
 */
export function accrueCompoundInterest(
  principal: number,
  rate_bps: number,
  elapsed_ms: number,
): number {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const ratePerMs = rate_bps / (BPS * MS_PER_YEAR);
  return Math.floor(principal * Math.pow(1 + ratePerMs, elapsed_ms));
}

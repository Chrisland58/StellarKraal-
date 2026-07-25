#![no_main]
//! Fuzz target: `liquidate` arithmetic and invariant checks.
//!
//! Mirrors the liquidation logic of `StellarKraal::liquidate` in
//! `contracts/stellarkraal/src/lib.rs`. It feeds arbitrary collateral values,
//! loan amounts, repay amounts, and protocol parameters into the same
//! arithmetic the contract uses and asserts the financial invariants the
//! protocol relies on:
//!
//! * a repay amount that exceeds the close-factor cap is always rejected;
//! * a liquidation can only proceed when the health factor is below 10 000 bps;
//! * after a valid liquidation the outstanding balance is non-negative;
//! * after a valid liquidation the outstanding balance is strictly less than
//!   the pre-liquidation balance;
//! * collateral seized is never greater than the total collateral value;
//! * no arithmetic panic or undefined behaviour occurs for any accepted input.

use arbitrary::Arbitrary;
use libfuzzer_sys::fuzz_target;

/// Basis-points denominator (1.0 == 10 000 bps), matching the contract.
const BPS_DENOMINATOR: i128 = 10_000;

/// Maximum origination-fee rate enforced by `update_fee_config` (5 %).
const MAX_ORIG_FEE_BPS: u32 = 500;

// ── Input ────────────────────────────────────────────────────────────────────

/// Arbitrary loan / collateral state used by the fuzzer.
#[derive(Arbitrary, Debug)]
struct Input {
    /// Total oracle-appraised value of all collateral backing the loan.
    total_collateral_value: i128,
    /// Original loan principal (amount borrowed).
    principal: i128,
    /// Current outstanding balance (≤ principal after any previous repayment).
    outstanding: i128,
    /// Liquidation threshold in basis points (e.g. 8 000 = 80 %).
    liq_threshold_bps: u32,
    /// Close factor in basis points – caps how much of the outstanding balance
    /// can be repaid in a single liquidation call (e.g. 5 000 = 50 %).
    close_factor_bps: u32,
    /// Amount the liquidator proposes to repay.
    repay_amount: i128,
}

// ── Pure re-implementations of contract logic ─────────────────────────────────

/// Mirror of `StellarKraal::compute_health_factor_with_thr`.
///
/// Returns `None` for inputs that the contract would reject with
/// `Error::InvalidAmount` (negative values, overflow).
/// Returns `Some(i128::MAX)` for a fully-repaid loan (`outstanding == 0`).
fn compute_health_factor(
    total_collateral_value: i128,
    outstanding: i128,
    liq_threshold_bps: u32,
) -> Option<i128> {
    if total_collateral_value < 0 || outstanding < 0 {
        return None;
    }
    if outstanding == 0 {
        return Some(i128::MAX);
    }
    let numerator = total_collateral_value.checked_mul(liq_threshold_bps as i128)?;
    let denominator = outstanding.checked_mul(BPS_DENOMINATOR)?;
    Some(numerator / denominator * BPS_DENOMINATOR)
}

/// Outcome of a simulated liquidation call.
#[derive(Debug)]
enum LiquidationOutcome {
    /// Input outside the contract's valid domain (rejected before any logic).
    InvalidInput,
    /// Repay amount is zero or negative — `Error::InvalidAmount`.
    InvalidRepayAmount,
    /// Health factor ≥ 1.0 — `Error::HealthFactorSafe`.
    HealthFactorSafe { health_factor: i128 },
    /// Repay amount exceeds the close-factor cap — `Error::ExceedsCloseFactor`.
    ExceedsCloseFactor { max_repay: i128 },
    /// Liquidation proceeds; fields record the post-liquidation state.
    Liquidated {
        outstanding_after: i128,
        collateral_seized: i128,
        fully_liquidated: bool,
    },
}

/// Pure re-implementation of the contract's `liquidate` function arithmetic.
///
/// Does **not** touch any real Soroban storage or token transfers — this is
/// intentionally a pure function so libFuzzer can run it at speed.
fn simulate_liquidation(
    total_collateral_value: i128,
    outstanding: i128,
    liq_threshold_bps: u32,
    close_factor_bps: u32,
    repay_amount: i128,
) -> LiquidationOutcome {
    // Guard: inputs must be in the contract's valid domain.
    if total_collateral_value < 0 || outstanding < 0 {
        return LiquidationOutcome::InvalidInput;
    }

    // Guard: repay_amount must be positive (contract checks `repay_amount <= 0`).
    if repay_amount <= 0 {
        return LiquidationOutcome::InvalidRepayAmount;
    }

    // Compute health factor; abort on overflow (contract returns InvalidAmount).
    let hf = match compute_health_factor(total_collateral_value, outstanding, liq_threshold_bps) {
        Some(v) => v,
        None => return LiquidationOutcome::InvalidInput,
    };

    // Check: loan must be unhealthy (health factor < 10 000 bps).
    if hf >= BPS_DENOMINATOR {
        return LiquidationOutcome::HealthFactorSafe { health_factor: hf };
    }

    // Compute max_repay = outstanding * close_factor / 10_000.
    let max_repay = match (outstanding as i128)
        .checked_mul(close_factor_bps as i128)
        .map(|v| v / BPS_DENOMINATOR)
    {
        Some(v) => v,
        None => return LiquidationOutcome::InvalidInput,
    };

    if repay_amount > max_repay {
        return LiquidationOutcome::ExceedsCloseFactor { max_repay };
    }

    // Apply repayment.
    let outstanding_after = match outstanding.checked_sub(repay_amount) {
        Some(v) => v,
        None => return LiquidationOutcome::InvalidInput,
    };

    // Collateral seized: proportional to the fraction of outstanding repaid.
    let collateral_seized = if outstanding > 0 {
        repay_amount
            .checked_mul(total_collateral_value)
            .unwrap_or(0)
            / outstanding
    } else {
        0
    };

    LiquidationOutcome::Liquidated {
        outstanding_after,
        collateral_seized,
        fully_liquidated: outstanding_after == 0,
    }
}

// ── Fuzz target ───────────────────────────────────────────────────────────────

fuzz_target!(|input: Input| {
    let Input {
        total_collateral_value,
        principal,
        outstanding,
        liq_threshold_bps,
        close_factor_bps,
        repay_amount,
    } = input;

    // Constrain protocol parameters to their contract-enforced valid ranges.
    //   liq_threshold_bps: 1..=10_000 (set_liquidation_threshold enforces ≥ 1)
    //   close_factor_bps:  1..=10_000 (set_close_factor enforces 1..=10_000)
    let liq_threshold_bps = (liq_threshold_bps % BPS_DENOMINATOR as u32) + 1;
    let close_factor_bps = (close_factor_bps % BPS_DENOMINATOR as u32) + 1;

    // Constrain outstanding to [0, principal] where both are non-negative, so the
    // simulated loan state is structurally valid (as it would be after origination).
    let principal = principal.abs();
    let outstanding = if principal == 0 {
        0
    } else {
        outstanding.abs() % (principal + 1)
    };

    match simulate_liquidation(
        total_collateral_value,
        outstanding,
        liq_threshold_bps,
        close_factor_bps,
        repay_amount,
    ) {
        LiquidationOutcome::Liquidated {
            outstanding_after,
            collateral_seized,
            fully_liquidated,
        } => {
            // Invariant 1: outstanding balance after liquidation is non-negative.
            assert!(
                outstanding_after >= 0,
                "outstanding_after went negative: {outstanding_after}"
            );

            // Invariant 2: liquidation reduces the outstanding balance.
            assert!(
                outstanding_after < outstanding,
                "liquidation did not reduce outstanding: before={outstanding}, after={outstanding_after}"
            );

            // Invariant 3: collateral seized is non-negative.
            assert!(
                collateral_seized >= 0,
                "collateral_seized went negative: {collateral_seized}"
            );

            // Invariant 4: collateral seized never exceeds total collateral.
            if total_collateral_value >= 0 {
                assert!(
                    collateral_seized <= total_collateral_value,
                    "collateral_seized {collateral_seized} > total_collateral_value {total_collateral_value}"
                );
            }

            // Invariant 5: fully liquidated implies outstanding == 0.
            if fully_liquidated {
                assert_eq!(
                    outstanding_after,
                    0,
                    "fully_liquidated set but outstanding_after is {outstanding_after}"
                );
            }
        }

        LiquidationOutcome::ExceedsCloseFactor { max_repay } => {
            // The contract rejects because repay_amount > max_repay.
            assert!(
                repay_amount > max_repay,
                "ExceedsCloseFactor but repay_amount {repay_amount} <= max_repay {max_repay}"
            );
        }

        LiquidationOutcome::HealthFactorSafe { health_factor } => {
            // The loan must actually be safe (hf ≥ 10 000 bps).
            assert!(
                health_factor >= BPS_DENOMINATOR,
                "HealthFactorSafe with hf={health_factor} < {BPS_DENOMINATOR}"
            );
        }

        // InvalidInput and InvalidRepayAmount are expected rejections; no assertions needed.
        LiquidationOutcome::InvalidInput | LiquidationOutcome::InvalidRepayAmount => {}
    }
});

// ── Regression tests ──────────────────────────────────────────────────────────
// Any crash discovered by the fuzzer MUST be converted to a unit test here so
// it is protected by the normal `cargo test` gate.

#[cfg(test)]
mod regression {
    use super::*;

    /// Fully-liquidating a loan with the maximum close factor (100 %) must leave
    /// outstanding == 0 and collateral_seized == total_collateral_value.
    #[test]
    fn full_liquidation_at_max_close_factor() {
        let result = simulate_liquidation(
            1_000_000, // total_collateral_value
            500_000,   // outstanding
            8_000,     // liq_threshold_bps (80 %)
            10_000,    // close_factor_bps  (100 %)
            500_000,   // repay_amount == outstanding
        );
        match result {
            LiquidationOutcome::Liquidated {
                outstanding_after,
                collateral_seized,
                fully_liquidated,
            } => {
                assert_eq!(outstanding_after, 0, "should be fully liquidated");
                assert!(fully_liquidated, "fully_liquidated flag must be set");
                assert_eq!(collateral_seized, 1_000_000, "all collateral seized");
            }
            other => panic!("expected Liquidated, got {other:?}"),
        }
    }

    /// A partial liquidation (50 % close factor) leaves exactly half outstanding.
    #[test]
    fn partial_liquidation_half_close_factor() {
        let result = simulate_liquidation(
            800_000, // total_collateral_value
            400_000, // outstanding
            8_000,   // liq_threshold_bps (80 %)
            5_000,   // close_factor_bps  (50 %)
            200_000, // repay_amount == 50 % of outstanding
        );
        match result {
            LiquidationOutcome::Liquidated {
                outstanding_after,
                fully_liquidated,
                ..
            } => {
                assert_eq!(outstanding_after, 200_000);
                assert!(!fully_liquidated);
            }
            other => panic!("expected Liquidated, got {other:?}"),
        }
    }

    /// A healthy loan must not be liquidatable, regardless of repay amount.
    #[test]
    fn healthy_loan_cannot_be_liquidated() {
        // HF = (2_000_000 * 8_000) / (100_000 * 10_000) * 10_000 = 16_000 >= 10_000 → safe
        let result = simulate_liquidation(
            2_000_000, // total_collateral_value
            100_000,   // outstanding (small)
            8_000,     // liq_threshold_bps
            5_000,     // close_factor_bps
            50_000,    // repay_amount
        );
        assert!(
            matches!(result, LiquidationOutcome::HealthFactorSafe { .. }),
            "expected HealthFactorSafe, got {result:?}"
        );
    }

    /// Repaying more than the close-factor cap must be rejected.
    #[test]
    fn exceeds_close_factor_is_rejected() {
        // HF = (100_000 * 8_000) / (500_000 * 10_000) * 10_000 = 1_600 < 10_000 → liquidatable
        // max_repay = 500_000 * 5_000 / 10_000 = 250_000
        let result = simulate_liquidation(
            100_000, // total_collateral_value (low → unhealthy)
            500_000, // outstanding
            8_000,   // liq_threshold_bps
            5_000,   // close_factor_bps
            250_001, // repay_amount > max_repay (250_000)
        );
        assert!(
            matches!(result, LiquidationOutcome::ExceedsCloseFactor { .. }),
            "expected ExceedsCloseFactor, got {result:?}"
        );
    }

    /// Zero repay amount must always be rejected (contract checks `repay_amount <= 0`).
    #[test]
    fn zero_repay_rejected() {
        let result = simulate_liquidation(500_000, 300_000, 8_000, 5_000, 0);
        assert!(
            matches!(result, LiquidationOutcome::InvalidRepayAmount),
            "expected InvalidRepayAmount, got {result:?}"
        );
    }

    /// Large i128 values must not panic (overflow paths are handled).
    #[test]
    fn overflow_candidate_no_panic() {
        let _ = simulate_liquidation(i128::MAX, i128::MAX / 2, 9_999, 10_000, i128::MAX / 4);
    }
}

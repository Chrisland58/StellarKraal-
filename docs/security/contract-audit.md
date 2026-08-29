# StellarKraal — Soroban Contract Security Checklist

**Document**: `docs/security/contract-audit.md`  
**Date**: 2026-07-24  
**Contract version**: head of `main`  
**Reviewed by**: Internal Security Team  
**Related document**: [`audit-internal.md`](./audit-internal.md) (backend security audit)

> This checklist focuses exclusively on **Soroban-specific** and **smart-contract-level**
> vulnerabilities. Backend and infrastructure concerns are covered in `audit-internal.md`.

---

## How to read this checklist

| Status | Meaning |
|---|---|
| ✅ **Mitigated** | Control exists in current contract code; verified by review. |
| ➖ **Not applicable** | The attack class does not apply to this contract / Soroban's execution model. |
| ⚠️ **Open** | Vulnerability is partially or fully unaddressed; linked to a tracking issue. |

Open items are linked to the GitHub issue where remediation is tracked.

---

## 1. Reentrancy

| Check | Status | Notes |
|---|---|---|
| All state writes complete before external token calls | ✅ Mitigated | `request_loan`, `repay_loan`, `liquidate` all update storage before calling `token::Client`. Checks-effects-interactions pattern is followed throughout. |
| `ReentrancyGuard` set in temporary storage prevents concurrent calls | ✅ Mitigated | `ReentrancyGuard::new` sets a temporary-storage sentinel; its `Drop` impl clears it. Any re-entrant call returns `Error::AlreadyInProgress` (#20). |
| Soroban execution model prevents classic reentrancy | ➖ Not applicable | Soroban contracts execute in a deterministic WASM sandbox; there is no mechanism for a called contract to call back into the caller mid-execution as in EVM. The guard is belt-and-suspenders defence. |

---

## 2. Integer Overflow / Underflow

| Check | Status | Notes |
|---|---|---|
| All arithmetic uses checked operations | ✅ Mitigated | Every `+`, `-`, `*` in the contract uses `checked_add`, `checked_sub`, `checked_mul`, propagating `Error::InvalidAmount` (#8) or `Error::ArithmeticOverflow` (#22) on overflow. |
| Division-by-zero guarded | ✅ Mitigated | Health-factor calculation guards `outstanding == 0` before dividing. Basis-points denominator (10 000) is a compile-time constant; cannot be zero. |
| Interest accrual accumulation bounded | ✅ Mitigated | Interest is calculated per repayment interval; no long-running accumulator that could silently overflow. |
| Fuzz testing for arithmetic paths | ⚠️ Open — [#118](https://github.com/teslims2/StellarKraal-/issues/118) | `cargo-fuzz` targets exist for `health_factor`, `interest_rate`, and `loan_request`. Coverage of edge-case i128 inputs is ongoing. |

---

## 3. Authentication / Authorisation Bypass

| Check | Status | Notes |
|---|---|---|
| Every admin function calls `assert_admin` + `require_auth` | ✅ Mitigated | `set_ltv`, `set_loan_limits`, `update_fee_config`, `pause`, `unpause`, `propose_upgrade`, `migrate_storage` etc. all check `assert_admin(&env, &admin)?` and then `admin.require_auth()`. |
| Borrower-only operations verify caller | ✅ Mitigated | `request_loan` calls `borrower.require_auth()`. `repay_loan` does not require auth (anyone may repay) — this is by design. |
| Liquidator whitelist enforced | ✅ Mitigated | `liquidate` checks `DataKey::WhitelistEntry(liquidator)` before proceeding; returns `Error::LiquidatorNotWhitelisted` (#23) otherwise. |
| Collateral ownership checked before loan creation | ✅ Mitigated | `request_loan` iterates all `collateral_ids` and returns `Error::Unauthorized` (#3) if any record's `owner != borrower`. |
| Admin transfer follows two-step pattern | ✅ Mitigated | `propose_admin_transfer` + acceptance prevents admin address from being locked to an unreachable account. |
| `initialize` can only be called once | ✅ Mitigated | Checks `env.storage().instance().has(&ADMIN)` and returns `Error::AlreadyInitialized` (#2). |
| Zero-address admin rejected at init | ✅ Mitigated | `initialize` rejects the all-zeros Stellar address (`GAAA…WHF`). |

---

## 4. Oracle Manipulation

| Check | Status | Notes |
|---|---|---|
| Multi-oracle median aggregation | ✅ Mitigated | `submit_oracle_prices` aggregates N responses, sorts, and takes the median. A single rogue oracle cannot move the price alone. |
| Minimum quorum enforced | ✅ Mitigated | `MIN_QUORUM` is set at `initialize`; `submit_oracle_prices` returns `Error::InsufficientOracleQuorum` (#17) if fewer responses than quorum are received. |
| Outlier flagging (deviation > 50 % from median) | ✅ Mitigated | Prices deviating > `DEV_BPS` from the median are flagged in `OracleReport.flagged_count` and excluded. |
| Price staleness threshold | ✅ Mitigated | `STALE_THR` (default 3 600 s). `health_factor` and `liquidate` return `Error::InvalidPrice` (#18) if the most recent price is older than the threshold. |
| TWAP for liquidation price | ✅ Mitigated | TWAP accumulator tracks a time-weighted average; the contract exposes `get_twap_data()`. Liquidation still uses the current (non-TWAP) price — see open item below. |
| Liquidations use spot price, not TWAP | ⚠️ Open — [#128](https://github.com/teslims2/StellarKraal-/issues/128) | Flash-loan price manipulation could make a healthy loan temporarily liquidatable. Using the TWAP price for liquidation decisions would close this vector. |
| Oracle address limit enforced | ✅ Mitigated | `OracleLimitReached` (#15) prevents unbounded oracle registration. |
| Price range validation | ✅ Mitigated | Individual prices are validated against `PRICE_MIN` / `PRICE_MAX` and the global `MAX_PRICE` constant (`10^18`). Zero or negative prices are rejected. |

---

## 5. Access Control — Pause Mechanism

| Check | Status | Notes |
|---|---|---|
| Pause blocks new loans and liquidations | ✅ Mitigated | `assert_not_paused` guard on `request_loan`, `register_livestock`, `liquidate`, `add_oracle`. |
| Repayments allowed while paused | ✅ Mitigated | `repay_loan` deliberately omits the pause check to let borrowers reduce risk at any time. |
| Pause has a maximum duration | ✅ Mitigated | `MAX_PAUSE_DURATION = 518 400 s` (~30 days) enforced in `set_pause_duration`. |
| Auto-expiry implemented | ✅ Mitigated | `assert_not_paused` checks `PAUSE_EXP`; if the current ledger timestamp is past expiry the contract self-unpauses. |
| Only admin can pause/unpause | ✅ Mitigated | Both `pause` and `unpause` call `assert_admin`. |

---

## 6. Upgrade Safety

| Check | Status | Notes |
|---|---|---|
| Contract upgrade requires admin and timelock | ✅ Mitigated | `propose_upgrade` stores a WASM hash; `execute_upgrade` enforces `UPGRADE_TIMELOCK_SECS = 86 400` (24 h) before applying the new WASM. |
| Upgrade can be cancelled | ✅ Mitigated | `cancel_upgrade` is admin-only and clears the pending proposal. |
| Post-upgrade migration hook exists | ✅ Mitigated | `migrate_storage` (Issue #699) is the canonical hook. Current version returns migration version `1` (no-op stub). Future versions must implement field migrations here. |
| Storage layout breaking changes require migration doc | ⚠️ Open — convention | No formal process exists yet to require a migration note for every storage-breaking change. Recommend enforcing this in the PR checklist. |

---

## 7. Loan Amount Bounds

| Check | Status | Notes |
|---|---|---|
| Minimum loan amount enforced | ✅ Mitigated | `MIN_LOAN` (default 10 000 000 stroops = 1 XLM) checked in `request_loan`; returns `Error::InvalidAmount` (#8). Configurable via `set_loan_limits` (Issue #700). |
| Maximum loan amount enforced | ✅ Mitigated | `MAX_LOAN` (default 1 000 000 000 000 stroops = 100 000 XLM) checked in `request_loan`; returns `Error::InvalidAmount` (#8). Configurable via `set_loan_limits` (Issue #700). |
| LTV cap enforced independently | ✅ Mitigated | Collateral LTV check is separate from min/max bounds; both must pass. |

---

## 8. Denial-of-Service (DoS)

| Check | Status | Notes |
|---|---|---|
| No unbounded loops over user-supplied data | ✅ Mitigated | `request_loan` iterates `collateral_ids` — this vector is supplied by the caller but consumed in a single transaction. `get_loans` is bounded by a hard 20-item cap. |
| Liquidator whitelist size bounded | ✅ Mitigated | `WL_COUNT` is checked before adding a new whitelisted liquidator. |
| Oracle list bounded | ✅ Mitigated | `OracleLimitReached` (#15) caps the oracle list. |
| Storage TTL managed for persistent entries | ✅ Mitigated | Loan and collateral entries call `extend_ttl` after creation to avoid silent expiry (`PERSISTENT_TTL_THRESHOLD = 100 000`, `PERSISTENT_TTL_LEDGERS = 518 400`). |

---

## 9. Economic / Incentive Attacks

| Check | Status | Notes |
|---|---|---|
| Close-factor cap prevents full liquidations in one call | ✅ Mitigated | `CLOSE_FACTOR` (default 50 %) limits how much debt can be liquidated per call, protecting borrowers from full wipe-out in a single block. |
| Origination and interest fees within protocol limits | ✅ Mitigated | `update_fee_config` enforces a maximum of 500 bps (5 %) per fee type. |
| Dynamic interest rate model | ⚠️ Open — [#121](https://github.com/teslims2/StellarKraal-/issues/121) | The utilisation-based interest rate model parameters (`BASE_RATE`, `SLOPE1`, `SLOPE2`, `KINK`) are stored but the dynamic calculation is not yet fully integrated into repayment accrual. |
| Treasury address validated | ✅ Mitigated | `initialize` stores the treasury; fee transfers use the SAC token client, not raw sends. |

---

## 10. Data Integrity / Storage Consistency

| Check | Status | Notes |
|---|---|---|
| Loan status transitions are uni-directional | ✅ Mitigated | `Active → Repaid` and `Active → Liquidated` only; code never transitions back to `Active`. |
| Collateral `loan_id` cleared after repayment | ✅ Mitigated | `repay_loan` sets `col.loan_id = 0` on full repayment, freeing collateral for re-use. |
| Total-borrowed / total-liquidity tracking | ✅ Mitigated | `TOTAL_BORROWED` and `TOTAL_LIQUIDITY` are updated on every loan create/repay/liquidate. |
| Counter IDs are monotonically increasing | ✅ Mitigated | `next_id` helper increments `LoanCounter` / `CollateralCounter` atomically; no reuse possible. |

---

## Open Items Summary

| # | Area | Severity | Issue |
|---|---|---|---|
| O-1 | Oracle manipulation — liquidation uses spot price | High | [#128](https://github.com/teslims2/StellarKraal-/issues/128) |
| O-2 | Dynamic interest rate not fully integrated | Medium | [#121](https://github.com/teslims2/StellarKraal-/issues/121) |
| O-3 | Fuzz coverage for arithmetic edge cases | Medium | [#118](https://github.com/teslims2/StellarKraal-/issues/118) |
| O-4 | No formal process for storage-breaking upgrade notes | Low | (convention, no issue yet) |

---

## Review Notes

- **Reentrancy**: Soroban's WASM sandbox makes cross-contract reentrancy structurally impossible in the EVM sense. The `ReentrancyGuard` is additional defence-in-depth.
- **Integer safety**: The use of `i128` for monetary values (instead of `u64`) means all values are signed. Guards against negative amounts (`amount <= 0`) are present in all entry points.
- **Oracle threat model**: The multi-oracle median design is sound for a permissioned oracle set. The open spot-price risk (O-1) is the single most important item before mainnet.
- **Loan bounds (Issue #700)**: Min/max loan limits are now configurable by the admin and default to 1 XLM / 100 000 XLM.
- **Upgrade migration (Issue #699)**: `migrate_storage` provides a standard post-upgrade hook. The current implementation is an idempotent stub; every future storage-breaking upgrade must add migration logic here.

---

*For backend/infrastructure security findings see [`audit-internal.md`](./audit-internal.md).*

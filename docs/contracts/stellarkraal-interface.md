# StellarKraal Soroban Contract Interface

This document describes the public interface for the `StellarKraal` Soroban smart contract in `contracts/stellarkraal/src/lib.rs`.
It covers contract functions, parameters, return values, error codes, on-chain state changes, and invocation examples using `stellar-cli`.

See also: [DataKey Enum Reference](./datakey-enum.md) — storage key documentation generated from rustdoc comments.

## Contract Overview

The contract manages livestock-backed loans with the following responsibilities:

- Register livestock as collateral.
- Accept loan requests against collateral value.
- Process loan repayments and liquidations.
- Enforce admin-controlled protocol parameters (fees, pause state, oracle configuration).
- Validate price updates from an external oracle and maintain TWAP pricing data.
- Support two-step WASM upgrades with a 24-hour timelock.

## Public Functions

### `initialize(env, admin, oracle, token, treasury, ltv_bps, liquidation_threshold_bps)`
- Description: Set initial protocol parameters and default fee, treasury, loan, and price state.
- Parameters:
  - `admin` — admin address with permission to update protocol settings. Must not be the all-zeros Stellar account.
  - `oracle` — authorized oracle address for price submissions.
  - `token` — token address used for SAC disbursements and repayments.
  - `treasury` — fee recipient address.
  - `ltv_bps` — loan-to-value ratio in basis points (e.g. `6000` = 60%). Must be in the range 1–9000 inclusive.
  - `liquidation_threshold_bps` — liquidation health threshold in basis points. Must be ≥ `ltv_bps`.
- Returns: `Result<(), Error>`.
- State changes: stores admin, oracle, token, treasury, LTV, liquidation threshold, fee rates, close factor, interest rate model, liquidity tracking, TWAP defaults, and oracle validation parameters.
- Errors:
  - `AlreadyInitialized` (#2) if called more than once.
  - `Unauthorized` (#3) if `admin` is the all-zeros account (`GAAA…WHF`).
  - `InvalidAmount` (#8) if `ltv_bps` is 0 or > 9000, or if `liquidation_threshold_bps` < `ltv_bps`.

---

## Pause / Unpause

### `is_paused(env)`
- Description: Query whether the contract is currently paused.
- Parameters: none.
- Returns: `bool`.
- State changes: none.

### `is_paused_with_expiry(env)`
- Description: Return the full pause status including optional expiry timestamp.
  Read-only — no authentication required.
- Parameters: none.
- Returns: `PauseStatus`:
  - `is_paused: bool` — `true` if the pause is still active.
  - `expires_at: Option<u64>` — ledger timestamp when the pause expires, or `None` for an indefinite pause.
- State changes: none.

### `pause(env, admin)`
- Description: Pause contract write operations until expiry. New loans and liquidations are blocked while paused; repayments remain allowed.
- Parameters: `admin` — must match the stored admin address.
- Returns: `Result<(), Error>`.
- State changes: sets `PAUSED = true` and `PAUSE_EXP = now + PAUSE_DUR`, emits `(Pause, activated)` event.
- Errors: `AlreadyPaused` if the contract is already paused.

### `unpause(env, admin)`
- Description: Resume contract operations before the automatic expiry.
- Parameters: `admin` — must match the stored admin address.
- Returns: `Result<(), Error>`.
- State changes: clears `PAUSED` and `PAUSE_EXP`, emits `(Pause, lifted)` event.
- Errors: `NotPaused` if the contract is not currently paused.

### `set_pause_duration(env, admin, duration)`
- Description: Update the default pause duration used by `pause()`. Maximum is `MAX_PAUSE_DURATION` (~30 days).
- Parameters:
  - `admin` — admin address.
  - `duration` — duration in seconds.
- Returns: `Result<(), Error>`.
- State changes: updates `PAUSE_DUR`.
- Errors: `InvalidAmount` if `duration > MAX_PAUSE_DURATION`.

---

## Admin / Governance

### `update_oracle(env, admin, new_oracle, new_min_quorum)`
- Description: Update the authorized oracle address and minimum quorum.
- Parameters:
  - `admin` — admin address.
  - `new_oracle` — new oracle address.
  - `new_min_quorum` — minimum number of oracle responses required.
- Returns: `Result<(), Error>`.
- State changes: updates `ORACLE`, emits an oracle update event.

### `set_animal_cap(env, admin, animal_type, max_value)`
- Description: Set the maximum accepted appraised value for a livestock type. Animal types without a configured cap are treated as uncapped (`u128::MAX`).
- Parameters:
  - `admin` — admin address.
  - `animal_type` — short symbol for livestock type.
  - `max_value` — maximum accepted appraised value in base units.
- Returns: `Result<(), Error>`.
- State changes: stores `AnimalCap(animal_type) = max_value`, emits an admin cap update event.

### `propose_new_admin(env, admin, new_admin)`
- Description: Start admin transfer by proposing a new admin address.
- Parameters:
  - `admin` — current admin address.
  - `new_admin` — proposed admin address.
- Returns: `Result<(), Error>`.
- State changes: stores `PENDING_ADMIN`, emits a proposal event.

### `accept_admin_role(env, new_admin)`
- Description: Accept admin role after it has been proposed.
- Parameters: `new_admin` — address that must match the pending admin.
- Returns: `Result<(), Error>`.
- State changes: replaces `ADMIN` with `PENDING_ADMIN`, clears `PENDING_ADMIN`, emits an admin update event.

### `set_treasury(env, admin, new_treasury)`
- Description: Update the treasury address that receives protocol fees. The zero address is rejected.
- Parameters:
  - `admin` — admin address.
  - `new_treasury` — new treasury address.
- Returns: `Result<(), Error>`.
- State changes: updates `TREASURY`, emits `(Admin, TreaUpd)` event.
- Errors: `Unauthorized` if `new_treasury` is the all-zeros account.

### `get_treasury(env)`
- Description: Return the current treasury address. Read-only — no authentication required.
- Parameters: none.
- Returns: `Result<Address, Error>`.
- State changes: none.
- Errors: `NotInitialized` if the contract has not been initialized.

---

## Collateral

### `register_livestock(env, owner, animal_type, count, appraised_value)`
- Description: Register a new collateral record for livestock.
- Parameters:
  - `owner` — collateral owner address.
  - `animal_type` — short symbol for livestock type (e.g. `cattle`).
  - `count` — number of animals.
  - `appraised_value` — oracle-appraised collateral value in base units (stroops).
- Returns: `Result<u64, Error>` — newly assigned collateral ID.
- State changes: creates `CollateralRecord` and stores it as unlocked collateral, emits a `(livestock, registered)` event.
- Errors:
  - `ContractPaused` if the contract is paused.
  - `InvalidAmount` if `count == 0` or `appraised_value <= 0`.
  - `InvalidAmount` if `appraised_value` exceeds the configured animal cap.

### `get_collateral(env, collateral_id)`
- Description: Read a collateral record.
- Parameters: `collateral_id` — collateral record identifier.
- Returns: `Result<CollateralRecord, Error>`.
- State changes: none.
- Errors: `CollateralNotFound` if no record exists for `collateral_id`.

### `get_collateral_count(env, owner)`
- Description: Get the number of non-liquidated collaterals registered by an owner.
- Parameters: `owner` — owner address.
- Returns: `u32` — count of non-liquidated collaterals. Returns 0 if none.
- State changes: none.

### `reappraise_collateral(env, caller, id, new_value)`
- Description: Update the appraised value of a collateral record. Callable by the collateral owner **or** any registered oracle.
- Parameters:
  - `caller` — must be either the collateral owner or a registered oracle address.
  - `id` — collateral record identifier.
  - `new_value` — new appraised value in base units. Must be > 0.
- Returns: `Result<(), Error>`.
- State changes: updates `collateral.appraised_value`, appends to `appraisal_history` (capped at 3 entries), emits `(livestock, reappraised)` event.
- Errors:
  - `CollateralNotFound` if the record does not exist.
  - `InvalidAmount` if `new_value <= 0`.
  - `Unauthorized` if `caller` is neither the owner nor a registered oracle.

### `update_appraisal(env, owner, collateral_id, new_value)`
- Description: Owner-only alias for updating a collateral's appraised value. Blocked when the contract is paused.
- Parameters:
  - `owner` — must match the collateral's stored owner address.
  - `collateral_id` — collateral record identifier.
  - `new_value` — new appraised value in base units. Must be > 0.
- Returns: `Result<(), Error>`.
- State changes: updates `collateral.appraised_value`, appends to `appraisal_history`, emits `(collat, appraised)` event.
- Errors:
  - `ContractPaused` if the contract is paused.
  - `CollateralNotFound` if the record does not exist.
  - `InvalidAmount` if `new_value <= 0`.
  - `Unauthorized` if `owner` does not match the stored owner.

### `get_appraisal_history(env, collateral_id)`
- Description: Return the rolling appraisal history (up to the last 3 values) for a collateral record.
- Parameters: `collateral_id` — collateral record identifier.
- Returns: `Result<Vec<i128>, Error>`.
- State changes: none.
- Errors: `CollateralNotFound` if the record does not exist.

---

## Loans

### `request_loan(env, borrower, collateral_ids, amount, loan_duration_ledgers)`
- Description: Request a new loan secured by one or more collateral records.
- Parameters:
  - `borrower` — borrower address (must be the owner of all supplied collateral).
  - `collateral_ids` — list of collateral record IDs. Must not be empty.
  - `amount` — requested gross loan amount in token base units (stroops). Must satisfy `MIN_LOAN ≤ amount ≤ MAX_LOAN`.
  - `loan_duration_ledgers` — optional `Option<u64>` deadline in seconds from now. When provided the stored `due_ledger` is set to `now + loan_duration_ledgers`. Pass `null` / `None` for an open-ended loan with no repayment deadline.
- Returns: `Result<u64, Error>` — newly assigned loan ID.
- State changes: validates collateral ownership, locks collaterals, stores `LoanRecord` (with optional `due_ledger`), transfers origination fee to treasury, disburses net amount to borrower, emits `(loan, requested)` event.
- Errors:
  - `ContractPaused` if the contract is paused.
  - `InvalidAmount` if `amount ≤ 0`, `amount < MIN_LOAN`, or `amount > MAX_LOAN`.
  - `InsufficientCollateral` (#4) if `amount > total_collateral_value × LTV / 10000`.
  - `CollateralNotFound` (#6) if `collateral_ids` is empty or contains an unknown ID.
  - `Unauthorized` (#3) if any collateral is owned by a different address.

#### Loan Amount Constants

| Constant | Default value | XLM equivalent | Storage key |
|---|---|---|---|
| `DEFAULT_MIN_LOAN` | `10_000_000` stroops | 1 XLM | `MIN_LOAN` (instance) |
| `DEFAULT_MAX_LOAN` | `1_000_000_000_000` stroops | 100,000 XLM | `MAX_LOAN` (instance) |

Both limits are configurable at runtime by the admin via `set_loan_limits`.

### `repay_loan(env, borrower, loan_id, amount)`
- Description: Repay part or all of an active loan. Allowed even when the contract is paused.
- Parameters:
  - `borrower` — loan borrower address.
  - `loan_id` — loan identifier.
  - `amount` — repayment amount in stroops. Capped at the outstanding balance.
- Returns: `Result<(), Error>`.
- State changes: transfers repayment into contract, deducts interest fee to treasury, reduces outstanding balance, updates status to `Repaid` when fully repaid, emits `(loan, repaid)` event.
- Errors:
  - `LoanNotFound` if the loan ID does not exist.
  - `LoanAlreadyClosed` if the loan is already repaid or liquidated.
  - `InvalidAmount` if `amount <= 0`.

### `get_loan(env, loan_id)`
- Description: Read a loan record.
- Parameters: `loan_id` — loan identifier.
- Returns: `Result<LoanRecord, Error>`.
- State changes: none.
- Errors: `LoanNotFound` if no record exists for `loan_id`.

### `get_loan_collaterals(env, loan_id)`
- Description: Return all collateral records backing a loan.
- Parameters: `loan_id` — loan identifier.
- Returns: `Result<Vec<CollateralRecord>, Error>`.
- State changes: none.
- Errors: `LoanNotFound` if the loan ID does not exist.

### `get_loan_count(env, borrower)`
- Description: Get the number of active loans for a borrower.
- Parameters: `borrower` — borrower address.
- Returns: `u32` — count of active loans. Returns 0 if none.
- State changes: none.

### `get_loans(env, ids)`
- Description: Batch-fetch multiple loan records by ID. IDs not found are silently omitted. Maximum of 20 IDs per call.
- Parameters: `ids` — `Vec<u64>` of loan IDs. Must not exceed 20 entries.
- Returns: `Result<Vec<LoanRecord>, Error>` — loan records for the IDs that exist.
- State changes: none.
- Errors: `InvalidAmount` if `ids.len() > 20`.

### `set_loan_limits(env, admin, min_loan, max_loan)`
- Description: Update the minimum and maximum loan amounts enforced by `request_loan`.
- Parameters:
  - `admin` — admin address.
  - `min_loan` — new minimum loan amount in stroops. Must be ≥ 1.
  - `max_loan` — new maximum loan amount in stroops. Must be > `min_loan`.
- Returns: `Result<(), Error>`.
- State changes: updates `MIN_LOAN` and `MAX_LOAN`, emits `(Admin, LoanLim)` event.
- Errors: `InvalidAmount` if constraints are not satisfied.

### `get_loan_limits(env)`
- Description: Return the current `(min_loan, max_loan)` configuration.
- Parameters: none.
- Returns: `Result<(i128, i128), Error>`.
- State changes: none.
- Errors: `NotInitialized` if the contract has not been initialized.

---

## Liquidation

### `liquidate(env, liquidator, loan_id, repay_amount)`
- Description: Liquidate a loan whose health factor is below 10 000 (< 1.0).
- Parameters:
  - `liquidator` — liquidator address. Must be on the whitelist when one is configured.
  - `loan_id` — loan identifier.
  - `repay_amount` — amount to repay, subject to the close-factor cap.
- Returns: `Result<(), Error>`.
- State changes: transfers repayment into contract, reduces outstanding balance, updates loan status to `Liquidated` if fully repaid, emits `(loan, liquidated)` event.
- Whitelist behaviour: when the liquidator whitelist is **empty** any address may call this function (open mode). When at least one address has been added via `add_liquidator`, only whitelisted addresses are permitted.
- Errors:
  - `ContractPaused` if the contract is paused.
  - `LoanNotFound` if the loan ID does not exist.
  - `HealthFactorSafe` (#7) if the loan's health factor is ≥ 10 000.
  - `ExceedsCloseFactor` (#11) if `repay_amount > close_factor × outstanding`.
  - `LiquidatorNotWhitelisted` (#23) if the whitelist is non-empty and the caller is not on it.

### `add_liquidator(env, admin, liquidator)`
- Description: Add an address to the approved liquidator whitelist. Idempotent — adding the same address twice has no effect.
- Parameters:
  - `admin` — must match the stored admin address.
  - `liquidator` — address to approve as a liquidator.
- Returns: `Result<(), Error>`.
- State changes: stores a `WhitelistEntry` in persistent storage, increments `WL_COUNT`, emits a `(whitelist, added)` event.

### `remove_liquidator(env, admin, liquidator)`
- Description: Remove an address from the approved liquidator whitelist. Idempotent — removing an address not on the list is a no-op.
- Parameters:
  - `admin` — must match the stored admin address.
  - `liquidator` — address to remove.
- Returns: `Result<(), Error>`.
- State changes: removes `WhitelistEntry` from persistent storage, decrements `WL_COUNT`, emits a `(whitelist, removed)` event.

### `is_whitelisted(env, liquidator)`
- Description: Query whether an address is permitted to liquidate. Returns `true` when the whitelist is empty (open mode) or when the address has been added via `add_liquidator`.
- Parameters: `liquidator` — address to check.
- Returns: `bool`.
- State changes: none.

### `set_close_factor(env, admin, close_factor_bps)`
- Description: Update the maximum liquidation repayment percentage.
- Parameters:
  - `admin` — admin address.
  - `close_factor_bps` — close factor in basis points. Must be > 0 and ≤ 10 000.
- Returns: `Result<(), Error>`.
- State changes: updates `CLOSE_FACTOR`.
- Errors: `InvalidCloseFactor` (#12) if out of bounds.

### `get_close_factor(env)`
- Description: Read the current close factor.
- Parameters: none.
- Returns: `Result<u32, Error>`.
- State changes: none.

---

## Health Factor

### `health_factor(env, loan_id)`
- Description: Compute the health factor scaled by 10 000 for a loan.
  - Returns `0` for past-due loans (where `due_ledger` is set and current timestamp exceeds it), making them immediately liquidatable.
  - Rejects with `InvalidPrice` if the latest oracle price is older than `STALE_THR`.
- Parameters: `loan_id` — loan identifier.
- Returns: `Result<i128, Error>`.
- State changes: none.

---

## LTV and Liquidation Threshold

### `get_ltv(env)`
- Description: Return the current loan-to-value ratio in basis points. Read-only — no authentication required.
- Parameters: none.
- Returns: `Result<u32, Error>`.
- State changes: none.

### `set_ltv(env, admin, ltv_bps)`
- Description: Update the loan-to-value ratio used for new loan requests.
- Parameters:
  - `admin` — must match the stored admin address.
  - `ltv_bps` — new LTV in basis points. Must be between 1000 (10%) and 9000 (90%).
- Returns: `Result<(), Error>`.
- State changes: updates `LTV`, emits `(Admin, LtvUpd)` event with old and new values.
- Errors: `InvalidAmount` if `ltv_bps` is outside the 1000–9000 range.

### `get_liquidation_threshold(env)`
- Description: Return the current liquidation threshold in basis points. Read-only — no authentication required.
- Parameters: none.
- Returns: `Result<u32, Error>` — e.g. `8000` = 80%.
- State changes: none.
- Errors: `NotInitialized` if the contract has not been initialized.

### `set_liquidation_threshold(env, admin, threshold_bps)`
- Description: Update the liquidation threshold.
- Parameters:
  - `admin` — admin address.
  - `threshold_bps` — new threshold in basis points.
- Returns: `Result<(), Error>`.
- State changes: updates `LIQ_THR`, emits a threshold update event.

---

## Fees

### `update_fee_config(env, admin, origination_fee_bps, interest_fee_bps)`
- Description: Update origination and interest fee rates. Both values must not exceed 500 bps (5%).
- Parameters:
  - `admin` — admin address.
  - `origination_fee_bps` — origination fee in basis points. Max 500.
  - `interest_fee_bps` — interest fee in basis points. Max 500.
- Returns: `Result<(), Error>`.
- State changes: updates `ORIG_FEE` and `INT_FEE`, emits `(fee, cfgUpd)` event.
- Errors: `InvalidFeeRate` (#10) if either value exceeds 500.

### `get_fee_config(env)`
- Description: Read the current fee configuration. Read-only — no authentication required.
- Parameters: none.
- Returns: `Result<FeeConfig, Error>`:
  - `origination_fee_bps: u32` — origination fee in bps (e.g. 50 = 0.5%).
  - `interest_fee_bps: u32` — interest fee in bps (e.g. 100 = 1%).
- State changes: none.
- Errors: `NotInitialized` if the contract has not been initialized.

---

## Interest Rate Model

### `set_interest_rate_model(env, admin, base_rate_bps, slope1_bps, slope2_bps, kink_bps)`
- Description: Update the jump-rate interest model.
- Parameters:
  - `admin` — admin address.
  - `base_rate_bps` — base interest rate in basis points.
  - `slope1_bps` — slope below the kink.
  - `slope2_bps` — slope above the kink.
  - `kink_bps` — utilization kink point in basis points.
- Returns: `Result<(), Error>`.
- State changes: updates `BASE_RATE`, `SLOPE1`, `SLOPE2`, and `KINK`.

### `get_interest_rate_model(env)`
- Description: Read the current interest rate model.
- Parameters: none.
- Returns: `Result<InterestRateModel, Error>`.
- State changes: none.

### `get_current_interest_rate(env)`
- Description: Compute the current interest rate from utilization.
- Parameters: none.
- Returns: `Result<u32, Error>`.
- State changes: none.

---

## Oracle and Price

> **Oracle design:** The protocol supports multiple registered oracles with on-chain median aggregation and a configurable quorum (`add_oracle`, `remove_oracle`, `get_oracles`, `submit_oracle_prices`), in addition to the single-oracle `submit_price` + TWAP path. For the full trust model, dispute handling, and rationale, see [ADR-006: Oracle design](../adr/ADR-006-oracle-design.md).

### `get_oracles(env)`
- Description: Return the current list of registered oracle addresses. Falls back to the legacy single `ORACLE` key when the `ORACLES` store has not been written yet.
- Parameters: none.
- Returns: `Vec<Address>` — ordered list of registered oracle addresses (0–5 entries).
- State changes: none.

### `add_oracle(env, admin, oracle)`
- Description: Register an additional oracle address. Maximum of 5 oracles allowed.
- Parameters:
  - `admin` — must match the stored admin address.
  - `oracle` — oracle address to add.
- Returns: `Result<(), Error>`.
- State changes: appends address to `ORACLES`.
- Errors: `Unauthorized` (non-admin), `OracleAlreadyRegistered` (#16), `OracleLimitReached` when count ≥ 5.

### `remove_oracle(env, admin, oracle)`
- Description: Deregister an existing oracle address. Refuses if this is the last oracle and active loans exist.
- Parameters:
  - `admin` — must match the stored admin address.
  - `oracle` — oracle address to remove.
- Returns: `Result<(), Error>`.
- State changes: removes address from `ORACLES`.
- Errors: `Unauthorized` (non-admin), `OracleNotFound` when address not present, `OracleRequired` when removing would leave zero oracles with active loans.

### `submit_oracle_prices(env, submitter, prices)`
- Description: Submit a price vector (one price per registered oracle) and compute the on-chain median. A zero entry indicates that oracle did not respond. A minimum quorum of 3 responses is required when 3+ oracles are registered; otherwise quorum equals oracle count.
- Parameters:
  - `submitter` — any authenticated address.
  - `prices` — `Vec<i128>` whose length must equal the number of registered oracles. Zero = no response.
- Returns: `Result<OracleReport, Error>`:
  - `median: i128` — median of non-zero prices.
  - `responses: u32` — count of non-zero prices.
  - `flagged_count: u32` — count of prices deviating > 50% from the median.
- State changes: none (read-only aggregation; the caller decides how to use the result).
- Errors: `InvalidPrice` (#18) if `prices.len() != oracles.len()`, `InsufficientOracleQuorum` if responses < quorum.

### `submit_price(env, oracle, price)`
- Description: Submit a new oracle price. Validates against configured bounds and staleness, then updates TWAP accumulators.
- Parameters:
  - `oracle` — authorized oracle address.
  - `price` — new price in base units. Must be > 0.
- Returns: `Result<(), Error>`.
- State changes: updates `LAST_PRICE`, `LAST_PRICE_TIME`, and TWAP accumulators.

### `get_twap_data(env)`
- Description: Read current TWAP pricing state.
- Parameters: none.
- Returns: `Result<TWAPData, Error>`.
- State changes: none.

### `set_twap_window(env, admin, window_ledgers)`
- Description: Update the TWAP averaging window. Must be > 0.
- Parameters:
  - `admin` — admin address.
  - `window_ledgers` — window length in ledgers (seconds).
- Returns: `Result<(), Error>`.
- State changes: updates `TWAP_WINDOW`, emits `(TWAP, winUpd)` event.
- Errors: `InvalidAmount` if `window_ledgers == 0`.

### `get_twap_window(env)`
- Description: Return the current TWAP window in ledgers. Defaults to 720 if unset.
- Parameters: none.
- Returns: `u64`.
- State changes: none.

### `set_staleness_threshold(env, admin, threshold)`
- Description: Update the price staleness threshold.
- Parameters:
  - `admin` — admin address.
  - `threshold` — staleness threshold in seconds. Must be > 0.
- Returns: `Result<(), Error>`.
- State changes: updates `STALE_THR`, emits `(StaleThr,)` event.
- Errors: `InvalidAmount` if `threshold == 0`.

### `get_staleness_threshold(env)`
- Description: Read the current price staleness threshold. Defaults to 3600 if unset.
- Parameters: none.
- Returns: `u64`.
- State changes: none.

### `set_oracle_config(env, admin, price_min, price_max, staleness_threshold, max_deviation_bps)`
- Description: Configure price bounds and freshness validation parameters.
- Parameters:
  - `admin` — admin address.
  - `price_min` — minimum accepted price (0 disables lower bound).
  - `price_max` — maximum accepted price (0 disables upper bound).
  - `staleness_threshold` — maximum age of a price update in seconds.
  - `max_deviation_bps` — maximum allowable deviation from the last price in basis points.
- Returns: `Result<(), Error>`.
- State changes: updates `PRICE_MIN`, `PRICE_MAX`, `STALE_THR`, and `DEV_BPS`.

### `get_oracle_config(env)`
- Description: Read the current oracle validation settings.
- Parameters: none.
- Returns: `Result<OracleConfig, Error>`.
- State changes: none.

---

## Admin State

### `get_state(env, admin)`
- Description: Return an admin-only operational summary of key contract state.
- Parameters: `admin` — admin address.
- Returns: `Result<ContractState, Error>`.
- State changes: none.
- Security: requires authorization from the stored admin address.
- Return type:

```rust
pub struct ContractState {
    pub admin: Address,
    pub token: Address,
    pub ltv_bps: u32,
    pub liq_threshold_bps: u32,
    pub is_paused: bool,
    pub oracle_count: u32,
    pub total_loans: u64,
    pub total_collaterals: u64,
}
```

### `emergency_withdraw(env, admin, recipient)`
- Description: Emergency withdrawal of all token reserves held by the contract. Only callable by admin when the contract is paused.
- Parameters:
  - `admin` — must match the stored admin address.
  - `recipient` — address to receive the withdrawn tokens.
- Returns: `Result<(), Error>`.
- State changes: transfers entire token balance to `recipient`, emits `(emergency,)` event.
- Errors:
  - `NotInitialized` if the contract has not been initialized.
  - `Unauthorized` if the caller is not admin.
  - `NotPaused` if the contract is not currently paused.

---

## Contract Upgrades

### `propose_upgrade(env, admin, new_wasm_hash)`
- Description: Step 1 of the two-step upgrade process. Stores the proposed new WASM hash and records the proposal timestamp to begin the 24-hour timelock.
- Parameters:
  - `admin` — admin address.
  - `new_wasm_hash` — `BytesN<32>` SHA-256 hash of the new WASM binary.
- Returns: `Result<(), Error>`.
- State changes: stores `PendingWasm` and `UpgradeTime` in persistent storage, emits `(upgrade, proposed)` event.

### `execute_upgrade(env)`
- Description: Step 2 of the upgrade process. Executes the pending upgrade after the 24-hour timelock has elapsed.
- Parameters: none (no admin auth required — the timelock is the guard).
- Returns: `Result<(), Error>`.
- State changes: removes `PendingWasm` and `UpgradeTime`, replaces contract WASM, emits `(upgrade, executed)` event.
- Errors:
  - `NoUpgradePending` if no upgrade has been proposed.
  - `TimelockNotElapsed` if fewer than 24 hours have passed since the proposal.

### `cancel_upgrade(env, admin)`
- Description: Cancel a pending upgrade proposal before execution.
- Parameters: `admin` — admin address.
- Returns: `Result<(), Error>`.
- State changes: removes `PendingWasm` and `UpgradeTime`, emits `(upgrade, canceled)` event.
- Errors: `NoUpgradePending` if no upgrade has been proposed.

### `migrate_storage(env, admin)`
- Description: Post-upgrade migration hook. Admin-only. The current version is a no-op stub that returns migration version `1`. Future versions should implement any required storage layout changes here.
- Parameters: `admin` — admin address.
- Returns: `Result<u32, Error>` — migration version number (currently `1`).
- State changes: emits `(Admin, MigDone)` event with the migration version.

---

## Error Codes

| Code | Error | Meaning |
|---|---|---|
| 1 | `NotInitialized` | Contract has not been initialized. |
| 2 | `AlreadyInitialized` | `initialize()` already executed. |
| 3 | `Unauthorized` | Caller is not authorized for the operation. |
| 4 | `InsufficientCollateral` | Requested loan exceeds LTV-backed collateral. |
| 5 | `LoanNotFound` | Loan ID does not exist. |
| 6 | `CollateralNotFound` | Collateral ID does not exist. |
| 7 | `HealthFactorSafe` | Loan health factor is healthy; liquidation not allowed. |
| 8 | `InvalidAmount` | Numeric argument is zero, negative, or out of range. |
| 9 | `LoanAlreadyClosed` | Loan is already repaid or liquidated. |
| 10 | `InvalidFeeRate` | Fee rate exceeds protocol maximum (500 bps). |
| 11 | `ExceedsCloseFactor` | Liquidation repayment exceeds close factor cap. |
| 12 | `InvalidCloseFactor` | Close factor is out of bounds. |
| 13 | `ContractPaused` | Contract is paused and write operations are blocked. |
| 14 | `AlreadyInProgress` | Reentrancy guard prevented nested execution. |
| 15 | `NotPaused` | Attempted unpause while contract is not paused. |
| 16 | `AlreadyPaused` | Attempted pause while contract is already paused. |
| 17 | `PriceBelowMin` | Oracle price below configured minimum. |
| 18 | `PriceAboveMax` | Oracle price above configured maximum. |
| 19 | `PriceStale` | Submitted price is too old. |
| 20 | `InvalidPrice` | Price vector length mismatch or invalid value. |
| 21 | `InsufficientOracleQuorum` | Not enough oracle responses to compute a median. |
| 22 | `ArithmeticOverflow` | Arithmetic overflow detected. |
| 23 | `LiquidatorNotWhitelisted` | Caller is not on the approved liquidator whitelist. |
| 24 | `OracleAlreadyRegistered` | Oracle address already in the registered list. |
| 25 | `OracleLimitReached` | Cannot add more than 5 oracles. |
| 26 | `OracleNotFound` | Oracle address not in the registered list. |
| 27 | `OracleRequired` | Removing the last oracle is blocked while active loans exist. |
| 28 | `NoUpgradePending` | No upgrade proposal exists. |
| 29 | `TimelockNotElapsed` | 24-hour upgrade timelock has not yet elapsed. |

---

## On-Chain State

Key contract storage state used by the interface:

- `ADMIN`, `PENDING_ADMIN` — admin authority and pending admin transfer.
- `ORACLE` — legacy single oracle address (used as fallback by `get_oracles`).
- `ORACLES` — instance-storage `Vec<Address>` of up to 5 registered oracle addresses.
- `AnimalCap(animal_type)` — optional per-animal-type maximum appraised value.
- `TOKEN`, `TREASURY` — token and treasury addresses.
- `LTV`, `LIQ_THR`, `ORIG_FEE`, `INT_FEE`, `CLOSE_FACTOR` — protocol parameters.
- `PAUSED`, `PAUSE_EXP`, `PAUSE_DUR` — pause control state.
- `CollateralRecord` and `LoanRecord` persistent storage keyed by IDs. `LoanRecord` includes an optional `due_ledger: Option<u64>` timestamp representing the repayment deadline.
- `MIN_LOAN`, `MAX_LOAN` — configurable loan amount bounds.
- `BASE_RATE`, `SLOPE1`, `SLOPE2`, `KINK` — jump-rate interest model parameters.
- `TOTAL_BORROWED`, `TOTAL_LIQUIDITY` — liquidity tracking state.
- `LAST_PRICE`, `LAST_PRICE_TIME`, `TWAP_PRICE`, `TWAP_SUM`, `TWAP_COUNT`, `TWAP_WINDOW` — oracle price and TWAP state.
- `PRICE_MIN`, `PRICE_MAX`, `STALE_THR`, `DEV_BPS` — oracle validation configuration.
- `WL_COUNT` — instance storage count of whitelisted liquidators (0 = open mode).
- `WhitelistEntry(Address)` — persistent storage flag per approved liquidator address.
- `DataKey::PendingWasm`, `DataKey::UpgradeTime` — pending WASM upgrade hash and proposal timestamp.

---

## Invoking the Contract with `stellar-cli`

Examples assume a deployed contract ID and Soroban testnet environment.
Replace the placeholder `G...` addresses with real Stellar public keys.

```bash
export CONTRACT_ID=GCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM
export RPC_URL=https://soroban-testnet.stellar.org
export NETWORK=testnet
```

### Initialize the contract

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn initialize \
  --arg address:GADMIN000000000000000000000000000000000000000000000ADMIN \
  --arg address:GORACLE000000000000000000000000000000000000000000ORACLE \
  --arg address:GTOKEN000000000000000000000000000000000000000000TOKEN0 \
  --arg address:GTREASURY0000000000000000000000000000000000000TREASURY \
  --arg 6000 \
  --arg 8000 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GADMIN000000000000000000000000000000000000000000000ADMIN
# Expected output: null  (unit return on success)
```

### Register livestock collateral

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn register_livestock \
  --arg address:GOWNER000000000000000000000000000000000000000000000OWNER \
  --arg cattle \
  --arg 5 \
  --arg 1000000 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GOWNER000000000000000000000000000000000000000000000OWNER
# Expected output: 1   (newly assigned collateral ID)
```

### Request a loan

With a 30-day repayment deadline (30 days ≈ 2 592 000 seconds):

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn request_loan \
  --arg address:GBORROWER000000000000000000000000000000000000000000000WL \
  --arg "[1,2]" \
  --arg 500000 \
  --arg 2592000 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GBORROWER000000000000000000000000000000000000000000000WL
# Expected output: 1   (the new loan ID)
```

Open-ended loan (no deadline):

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn request_loan \
  --arg address:GBORROWER000000000000000000000000000000000000000000000WL \
  --arg "[1,2]" \
  --arg 500000 \
  --arg null \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GBORROWER000000000000000000000000000000000000000000000WL
```

### Repay a loan

Partial repayment:

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn repay_loan \
  --arg address:GBORROWER000000000000000000000000000000000000000000000WL \
  --arg 1 \
  --arg 200000 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GBORROWER000000000000000000000000000000000000000000000WL
```

Full repayment (passing a large amount is safe — it is capped at the outstanding balance):

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn repay_loan \
  --arg address:GBORROWER000000000000000000000000000000000000000000000WL \
  --arg 1 \
  --arg 9999999999 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GBORROWER000000000000000000000000000000000000000000000WL
```

### Liquidate a loan

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn liquidate \
  --arg address:GLIQUIDATOR00000000000000000000000000000000000000000LQ \
  --arg 1 \
  --arg 250000 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GLIQUIDATOR00000000000000000000000000000000000000000LQ
# Errors:
#   #7  HealthFactorSafe         — loan is still healthy.
#   #11 ExceedsCloseFactor       — repay_amount exceeds close-factor cap.
#   #23 LiquidatorNotWhitelisted — caller not on whitelist.
```

### Query health factor

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn health_factor \
  --arg 1 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL"
# Expected output: 12500  (health factor 1.25 = 125% collateralisation)
```

### Query a loan record

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn get_loan \
  --arg 1 \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL"
```

### Submit a multi-oracle price

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn submit_oracle_prices \
  --arg address:GSUBMITTER0000000000000000000000000000000000000000SUB \
  --arg "[125000, 124800, 125200]" \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GSUBMITTER0000000000000000000000000000000000000000SUB
# Expected output: { "median": 125000, "responses": 3, "flagged_count": 0 }
```

### Propose and execute a contract upgrade

```bash
# Step 1 — propose (starts 24-hour timelock)
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn propose_upgrade \
  --arg address:GADMIN000000000000000000000000000000000000000000000ADMIN \
  --arg "<32-byte-wasm-hash-hex>" \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --source GADMIN000000000000000000000000000000000000000000000ADMIN

# Step 2 — execute (after 24 hours)
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn execute_upgrade \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL"
```

### Get oracles

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn get_oracles \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL"
```

### Query the liquidation threshold

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --fn get_liquidation_threshold \
  --network "$NETWORK" \
  --rpc-url "$RPC_URL"
# Expected output: 8000  (80 % threshold)
```

---

## Notes

- Repayments are allowed even when the contract is paused. New loans and liquidations are blocked.
- Liquidations are only permitted when `health_factor` is below 10 000 and `repay_amount` does not exceed the `CLOSE_FACTOR` cap.
- The contract uses `submit_price` to validate single-oracle updates before they affect TWAP state.
- `submit_oracle_prices` is a read-only aggregation helper — it does not write any state.

---

## Storage TTL Strategy

Soroban persistent storage entries expire after a configurable number of ledgers. Loan and collateral records are long-lived, so every write is followed by an `extend_ttl` call.

| Constant | Value | Approximate duration |
|---|---|---|
| `PERSISTENT_TTL_THRESHOLD` | 100,000 ledgers | ~5.7 days |
| `PERSISTENT_TTL_LEDGERS` | 518,400 ledgers | ~30 days |

**Behaviour:** On each write the entry's TTL is extended to `PERSISTENT_TTL_LEDGERS` only when its current TTL has fallen below `PERSISTENT_TTL_THRESHOLD`. This prevents redundant ledger writes for recently-updated entries.

**Off-chain responsibility:** Callers (backend or keeper bots) should additionally invoke `ExtendFootprintTTLOp` for dormant entries to prevent archival. See [Stellar docs — state archival](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival).

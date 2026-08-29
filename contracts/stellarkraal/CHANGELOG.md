# Changelog — StellarKraal Smart Contract

All notable changes to the `stellarkraal` Soroban smart contract are documented
here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **ABI compatibility policy** — patch releases (1.0.x) are fully backward
> compatible.  Minor releases (1.x.0) may add new function parameters with
> defaults and will document migration notes.  Major releases (x.0.0) may
> break the ABI and will include a migration guide.

---

## [Unreleased]

### Added
- `initialize()` now accepts a `twap_window_ledgers: u64` parameter so each
  deployment can tune price-smoothing at init time.  Passing `0` applies the
  720-ledger (~1 hour) default.  See [ADR-006] and
  [TWAP mechanism docs](../../docs/protocol/twap-mechanism.md). (closes #705)
- `set_twap_window(admin, window_ledgers)` — admin can update the TWAP window
  after deployment without redeploying. (closes #705)
- `get_twap_window()` — returns the current TWAP window in ledgers. (closes #705)

### Changed
- All fee multiplications in `request_loan` and `repay_loan` now use
  `checked_mul`, returning `Error::InvalidAmount` on overflow instead of
  panicking or silently wrapping. (closes #706)
- `repay_loan` interest-accrual arithmetic uses `checked_mul` throughout.
  (closes #706)

---

## [1.0.0] — 2026-04-28

Initial on-chain deployment of the StellarKraal livestock-backed lending
protocol on Stellar/Soroban.

See also:
- [Smart Contract Interface](../../docs/contracts/stellarkraal-interface.md)
- [DataKey Enum Reference](../../docs/contracts/datakey-enum.md)
- [Loan State Machine](../../docs/protocol/loan-state-machine.md)
- [Liquidation Mechanism](../../docs/protocol/liquidation.md)
- [TWAP Mechanism](../../docs/protocol/twap-mechanism.md)
- [ADR-001 — Soroban][ADR-001]
- [ADR-006 — Oracle Design][ADR-006]

### Added

#### Initialisation

| Function | Signature | Description |
|---|---|---|
| `initialize` | `(admin, oracle, token, treasury, ltv_bps, liquidation_threshold_bps, min_quorum) → Result<(), Error>` | One-time protocol setup. Stores admin, oracle, token, treasury, LTV ratio, liquidation threshold, fee rates, interest-rate model parameters, close factor, and TWAP defaults. Returns `AlreadyInitialized` if called again. |

#### Collateral management

| Function | Signature | Description |
|---|---|---|
| `register_livestock` | `(owner, animal_type, count, appraised_value) → Result<u64, Error>` | Register an animal-backed collateral record. Returns a unique collateral ID. Blocked when paused. |
| `update_appraisal` | `(owner, collateral_id, new_value) → Result<(), Error>` | Update the appraised value of an existing collateral. Keeps a rolling 3-entry appraisal history. Blocked when paused. |
| `get_collateral` | `(collateral_id) → Result<CollateralRecord, Error>` | Fetch a collateral record by ID. |
| `get_appraisal_history` | `(collateral_id) → Result<Vec<i128>, Error>` | Return the rolling appraisal history (up to 3 entries). |
| `get_collateral_count` | `(owner) → u32` | Count non-liquidated collateral records owned by an address. |

#### Loan lifecycle

| Function | Signature | Description |
|---|---|---|
| `request_loan` | `(borrower, collateral_ids, amount) → Result<u64, Error>` | Request a new loan against one or more collateral records. Disburses `amount − origination_fee` to the borrower. Protected by a reentrancy guard. Blocked when paused. |
| `repay_loan` | `(borrower, loan_id, amount) → Result<(), Error>` | Repay part or all of an outstanding loan. Accrues interest on-chain. Repayment is **not** blocked when the contract is paused. Protected by a reentrancy guard. |
| `liquidate` | `(liquidator, loan_id, repay_amount) → Result<(), Error>` | Liquidate an undercollateralised loan position. Enforces close-factor cap. Respects liquidator whitelist when enabled. Blocked when paused. Protected by a reentrancy guard. |
| `get_loan` | `(loan_id) → Result<LoanRecord, Error>` | Fetch a loan record by ID. |
| `get_loan_collaterals` | `(loan_id) → Result<Vec<CollateralRecord>, Error>` | Return all collateral records associated with a loan. |
| `get_loan_count` | `(borrower) → u32` | Count active loans for a borrower address. |
| `get_loans` | `(ids: Vec<u64>) → Result<Vec<LoanRecord>, Error>` | Batch-fetch up to 20 loan records by ID list. Non-existent IDs are silently skipped. |
| `health_factor` | `(loan_id) → Result<i128, Error>` | Compute the health factor (scaled × 10 000) for a loan. Returns `InvalidPrice` if the oracle price is stale. |

#### Oracle & price feeds

| Function | Signature | Description |
|---|---|---|
| `submit_price` | `(oracle, price) → Result<(), Error>` | Submit a single price observation; updates TWAP accumulator and last-price state. |
| `submit_oracle_prices` | `(submitter, prices) → Result<OracleReport, Error>` | Submit multiple oracle prices; computes median, flags outliers, updates last-price state. |
| `add_oracle` | `(admin, oracle) → Result<(), Error>` | Register an oracle address (max 5). |
| `remove_oracle` | `(admin, oracle) → Result<(), Error>` | Remove a registered oracle address. |
| `get_oracles` | `() → Vec<Address>` | Return all registered oracle addresses. |
| `get_twap_data` | `() → Result<TWAPData, Error>` | Return current TWAP state: `current_price`, `twap_price`, `last_update`. |
| `set_staleness_threshold` | `(admin, threshold) → Result<(), Error>` | Set the maximum age (in seconds) before oracle prices are considered stale. |
| `get_staleness_threshold` | `() → u64` | Return the current price staleness threshold. |

#### Admin / governance

| Function | Signature | Description |
|---|---|---|
| `pause` | `(admin) → Result<(), Error>` | Pause contract write operations (auto-expires after the configured pause duration). |
| `unpause` | `(admin) → Result<(), Error>` | Resume contract operations before expiry. |
| `set_pause_duration` | `(admin, duration) → Result<(), Error>` | Configure default pause duration (max ~30 days / 518 400 s). |
| `is_paused` | `() → bool` | Query current pause state (respects auto-expiry). |
| `set_ltv` | `(admin, ltv_bps) → Result<(), Error>` | Update the loan-to-value ratio (1 000–9 000 bps). |
| `set_liquidation_threshold` | `(admin, threshold_bps) → Result<(), Error>` | Update the liquidation threshold in basis points. |
| `set_close_factor` | `(admin, close_factor_bps) → Result<(), Error>` | Update the close-factor cap for liquidations. |
| `get_close_factor` | `() → Result<u32, Error>` | Return the current close factor in basis points. |
| `update_fee_config` | `(admin, origination_fee_bps, interest_fee_bps) → Result<(), Error>` | Update origination and interest fee rates (each capped at 500 bps / 5 %). |
| `get_fee_config` | `() → Result<FeeConfig, Error>` | Return the current fee configuration. |
| `update_oracle` | `(admin, new_oracle, new_min_quorum) → Result<(), Error>` | Update the primary oracle address and optionally the minimum quorum. |
| `set_animal_cap` | `(admin, animal_type, max_value) → Result<(), Error>` | Set the maximum accepted appraised value for an animal type. |
| `add_liquidator` | `(admin, liquidator) → Result<(), Error>` | Add an address to the approved liquidator whitelist. |
| `remove_liquidator` | `(admin, liquidator) → Result<(), Error>` | Remove an address from the liquidator whitelist. |
| `is_whitelisted` | `(liquidator) → bool` | Returns `true` if address is whitelisted, or whitelist is empty (open mode). |
| `propose_new_admin` | `(admin, new_admin) → Result<(), Error>` | Step 1 of two-step admin transfer: propose a new admin. |
| `accept_admin_role` | `(new_admin) → Result<(), Error>` | Step 2 of two-step admin transfer: accept the pending admin role. |
| `emergency_withdraw` | `(admin, recipient) → Result<(), Error>` | Emergency withdrawal of all token reserves. Contract must be paused. |
| `get_state` | `(admin) → Result<ContractState, Error>` | Admin-readable summary of key contract state. |

#### Contract upgrades

| Function | Signature | Description |
|---|---|---|
| `propose_upgrade` | `(admin, new_wasm_hash) → Result<(), Error>` | Step 1 of two-step WASM upgrade: record the proposed hash and start the 24-hour timelock. |
| `execute_upgrade` | `() → Result<(), Error>` | Step 2: execute the pending upgrade after the 24-hour timelock elapses. |
| `cancel_upgrade` | `(admin) → Result<(), Error>` | Cancel a pending upgrade proposal. |

### Error Codes

| Code | Variant | Description |
|---|---|---|
| 1 | `NotInitialized` | Contract has not been initialised. |
| 2 | `AlreadyInitialized` | `initialize` called on an already-initialised contract. |
| 3 | `Unauthorized` | Caller is not authorised. |
| 4 | `InsufficientCollateral` | Loan amount exceeds the LTV-allowed maximum. |
| 5 | `LoanNotFound` | No loan record for the given ID. |
| 6 | `CollateralNotFound` | No collateral record for the given ID. |
| 7 | `HealthFactorSafe` | Liquidation attempted on a healthy loan. |
| 8 | `InvalidAmount` | Zero, negative, or overflow-inducing value. |
| 9 | `LoanAlreadyClosed` | Operation requires an active loan but it is closed. |
| 10 | `InvalidFeeRate` | Fee rate exceeds the 500 bps protocol maximum. |
| 11 | `ExceedsCloseFactor` | Liquidation repay amount exceeds the close-factor cap. |
| 12 | `InvalidCloseFactor` | Close factor outside the 1–10 000 bps range. |
| 13 | `ContractPaused` | Operation blocked because the contract is paused. |
| 14 | `OracleAlreadyRegistered` | Oracle address already in the registry. |
| 15 | `OracleLimitReached` | Maximum of 5 oracles already registered. |
| 16 | `OracleNotFound` | Oracle address not found in the registry. |
| 17 | `InsufficientOracleQuorum` | Fewer oracle responses than the minimum quorum. |
| 18 | `InvalidPrice` | Price is zero, negative, or exceeds `MAX_PRICE` (10^18). |
| 19 | `NotPaused` | `unpause` or `emergency_withdraw` called when not paused. |
| 20 | `AlreadyInProgress` | Reentrancy guard triggered. |
| 21 | `AlreadyPaused` | `pause` called when already paused. |
| 22 | `ArithmeticOverflow` | Checked arithmetic detected an overflow. |
| 23 | `LiquidatorNotWhitelisted` | Liquidator not on the approved whitelist. |
| 24 | `NoUpgradePending` | `execute_upgrade` or `cancel_upgrade` with no pending proposal. |
| 25 | `TimelockNotElapsed` | `execute_upgrade` called before the 24-hour timelock. |

### Protocol constants

| Constant | Value | Description |
|---|---|---|
| `MAX_PAUSE_DURATION` | 518 400 s (~30 days) | Maximum allowed pause duration. |
| `UPGRADE_TIMELOCK_SECS` | 86 400 s (24 hours) | Minimum delay between upgrade proposal and execution. |
| `MAX_PRICE` | 10^18 | Maximum accepted oracle price. |
| `PERSISTENT_TTL_THRESHOLD` | 100 000 ledgers (~5.7 days) | Minimum remaining TTL before a persistent entry is extended. |
| `PERSISTENT_TTL_LEDGERS` | 518 400 ledgers (~30 days) | Target TTL applied when extending a persistent entry. |

---

## Known Limitations

The following limitations are known as of v1.0.0 and are tracked for future resolution:

| Limitation | Impact | Planned fix |
|---|---|---|
| **In-process reentrancy guard only** | The `AlreadyInProgress` guard prevents re-entry within a single contract call stack, but does not protect against cross-contract reentrancy via a malicious token contract. | Migrate to a persistent ledger flag in a future minor release. |
| **Maximum 5 oracle addresses** | `OracleLimitReached` is returned if more than 5 oracles are registered. This limits decentralisation of price feeds. | Increase the cap or switch to a dynamic vector in a future version. |
| **Rolling appraisal history capped at 3 entries** | `get_appraisal_history` returns at most the last 3 appraised values. Historical audit trails require off-chain storage. | Expand to a configurable window in a future version. |
| **No on-chain loan deadline enforcement** | `due_ledger` is stored but not automatically enforced by the contract; enforcement requires an off-chain keeper (the backend health-factor job). | Add on-chain expiry enforcement in a future minor release. |
| **`emergency_withdraw` transfers all reserves** | The function drains the entire token balance to a single recipient address. Partial withdrawals are not supported. | Add an `amount` parameter in a future minor release. |
| **Persistent storage entries require manual TTL renewal** | Ledger entries not accessed within `PERSISTENT_TTL_LEDGERS` (~30 days) expire. The backend must refresh entries proactively. | Document and automate TTL refresh in the backend health-factor job. |
| **Single-token protocol** | The contract is initialised with one token address. Multi-currency collateral or repayment is not supported. | Requires a major version with ABI-breaking changes. |

---

## Template for future versions

Copy this block when releasing a new version:

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- 

### Changed
- 

### Deprecated
- 

### Removed
- 

### Fixed
- 

### Security
- 
```

---

[Unreleased]: https://github.com/teslims2/StellarKraal-/compare/contracts/v1.0.0...HEAD
[1.0.0]: https://github.com/teslims2/StellarKraal-/releases/tag/contracts/v1.0.0
[ADR-001]: ../../docs/adr/ADR-001-soroban.md
[ADR-006]: ../../docs/adr/ADR-006-oracle-design.md

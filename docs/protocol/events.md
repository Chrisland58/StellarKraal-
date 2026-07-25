# StellarKraal — Contract Event Schemas

> **Source of truth**: `contracts/stellarkraal/src/lib.rs`  
> **Backend listener**: [`backend/src/contractEventListener.ts`](../../backend/src/contractEventListener.ts)  
>
> This document supersedes the earlier event listing and provides **complete typed schemas**
> for every event emitted by the StellarKraal Soroban contract, including topics tuple,
> data tuple, field types, and a JSON example.

---

## Overview

All events are published via the Soroban SDK call:

```rust
env.events().publish(topics_tuple, data_tuple);
```

- **topics** — a tuple of `Symbol` values (and sometimes `Address` or `u64`) that identify
  the event type. Indexed by the RPC for efficient filtering.
- **data** — a tuple of typed values carrying the payload.

When filtering with `SorobanRpc.Server.getEvents()` supply the contract ID and optionally
a topic filter using `symbol_short!` strings (max 8 bytes, ASCII) or `Symbol::new` strings.

---

## Event Index

| Event name (topics[0]) | topics[1] | Emitted by | Section |
|---|---|---|---|
| `livestock` / `registered` | — | `register_livestock` | [§1](#1-livestock--registered) |
| `loan` / `requested` | — | `request_loan` | [§2](#2-loan--requested) |
| `loan_repaid` | `borrower` | `repay_loan` | [§3](#3-loan_repaid) |
| `loan` / `liquidated` | — | `liquidate` | [§4](#4-loan--liquidated) |
| `FeeCol` / `<loan_id>` | — | `request_loan`, `repay_loan` | [§5](#5-feecol--fee-collected) |
| `fee` / `cfgUpd` | — | `update_fee_config` | [§6](#6-fee--cfgupd) |
| `collat` / `appraised` | — | `update_appraisal` | [§7](#7-collat--appraised) |
| `whitelist` / `added` | — | `add_liquidator` | [§8](#8-whitelist--added) |
| `whitelist` / `removed` | — | `remove_liquidator` | [§9](#9-whitelist--removed) |
| `Admin` / `LtvUpd` | — | `set_ltv` | [§10](#10-admin--ltvupd) |
| `Admin` / `LoanLim` | — | `set_loan_limits` | [§11](#11-admin--loanlim) |
| `Admin` / `LiqThrUpd` | — | `set_liquidation_threshold` | [§12](#12-admin--liqthrupd) |
| `Admin` / `OracleUpd` | — | `set_oracle` | [§13](#13-admin--oracleupd) |
| `Admin` / `PropNewAd` | — | `propose_admin_transfer` | [§14](#14-admin--propnewad) |
| `Admin` / `AdminUpd` | — | `accept_admin_transfer` | [§15](#15-admin--adminupd) |
| `Admin` / `MigDone` | — | `migrate_storage` | [§16](#16-admin--migdone) |
| `Pause` | — | `pause` | [§17](#17-pause) |
| `Unpause` | — | `unpause` | [§18](#18-unpause) |
| `StaleThr` | — | `set_staleness_threshold` | [§19](#19-stalethr) |
| `TWAP` / `price` | — | `submit_oracle_prices` | [§20](#20-twap--price) |
| `upgrade` / `proposed` | — | `propose_upgrade` | [§21](#21-upgrade--proposed) |
| `upgrade` / `executed` | — | `execute_upgrade` | [§22](#22-upgrade--executed) |
| `upgrade` / `canceled` | — | `cancel_upgrade` | [§23](#23-upgrade--canceled) |

---

## Type Reference

| Soroban type | JSON representation | Notes |
|---|---|---|
| `Symbol` | `string` | Short symbol (≤ 8 chars, ASCII) or long symbol string |
| `Address` | `string` | Stellar G-address (56 chars) |
| `u32` | `number` | Unsigned 32-bit integer |
| `u64` | `number` (or `string` for large values) | Unsigned 64-bit integer |
| `i128` | `string` | Signed 128-bit integer; serialised as decimal string to avoid JS precision loss |
| `bool` | `boolean` | — |

---

## Events

### `collateral_registered`

Emitted by `register_livestock` when a new collateral record is created.

| Field | Topic/Data | Type | Description |
|---|---|---|---|
| `collateral_registered` | topic[0] | `Symbol` | Event discriminator |
| `owner` | topic[1] | `Address` | Owner's Stellar address |
| `collateral_id` | data[0] | `u64` | Assigned collateral ID |
| `animal_type` | data[1] | `Symbol` | Species symbol (e.g. `cattle`) |
| `count` | data[2] | `u32` | Number of animals |
| `appraised_value` | data[3] | `i128` | Oracle-appraised total value |
### 1. `livestock` / `registered`

Emitted by `register_livestock` when a new collateral record is created.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"livestock"` | `Symbol` (`symbol_short!`) |
| 1 | `"registered"` | `Symbol` (`Symbol::new`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `collateral_id` | `u64` | Unique ID assigned to the new collateral record |
| `owner` | `Address` | Stellar address of the collateral owner |
| `animal_type` | `Symbol` | Species (e.g. `"cattle"`, `"goat"`, `"sheep"`) |
| `count` | `u32` | Number of animals registered |
| `appraised_value` | `i128` | Oracle-appraised total value in token base units (stroops) |

**Example JSON:**
```json
{
  "topics": ["livestock", "registered"],
  "data": {
    "collateral_id": 1,
    "owner": "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPGK7FHZM5YIOP7GKEUYFQVYW",
    "animal_type": "cattle",
    "count": 10,
    "appraised_value": "5000000000"
  }
}
```

---

### 2. `loan` / `requested`

Emitted by `request_loan` after a loan is originated.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"loan"` | `Symbol` (`symbol_short!`) |
| 1 | `"requested"` | `Symbol` (`Symbol::new`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `loan_id` | `u64` | Unique ID assigned to the loan |
| `borrower` | `Address` | Borrower's Stellar address |
| `amount` | `i128` | Gross loan amount requested (before origination fee) |
| `disbursement` | `i128` | Net amount disbursed to borrower (`amount − origination_fee`) |
| `total_collateral_value` | `i128` | Sum of appraised values of all collaterals at origination |

### `loan_repaid`
**Example JSON:**
```json
{
  "topics": ["loan", "requested"],
  "data": {
    "loan_id": 7,
    "borrower": "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPGK7FHZM5YIOP7GKEUYFQVYW",
    "amount": "1000000000",
    "disbursement": "995000000",
    "total_collateral_value": "5000000000"
  }
}
```

---

### 3. `loan_repaid`

Emitted by `repay_loan` after each repayment (partial or full).

**Topics:**

| Index | Value | Type |
|---|---|---|
| `loan_id` | `u64` | Loan ID |
| `principal_paid` | `i128` | Amount of principal repaid in this transaction |
| `interest_paid` | `i128` | Amount of interest repaid in this transaction |
| `remaining_balance` | `i128` | Remaining outstanding balance after repayment |

### `loan_liquidated`

Emitted by `liquidate` after a partial or full liquidation.
| 0 | `"loan_repaid"` | `Symbol` (`Symbol::new`) |
| 1 | `borrower` | `Address` |

**Data:**

**Topics:** `[symbol!(loan_liquidated), borrower, liquidator]`

| Position | Value | Type | Description |
|---|---|---|---|
| topics[0] | `loan_liquidated` | `Symbol` | Event identifier |
| topics[1] | `borrower` | `Address` | Borrower's Stellar address |
| topics[2] | `liquidator` | `Address` | Liquidator's Stellar address |

**Data:**

| Field | Type | Description |
|---|---|---|
| `loan_id` | `u64` | Loan ID |
| `repay_amount` | `i128` | Amount repaid by the liquidator |
| `collateral_seized` | `i128` | Proportional collateral value seized (`repay_amount × total_collateral_value / outstanding_before`) |
| `principal_paid` | `i128` | Principal component repaid in this transaction |
| `interest_paid` | `i128` | Interest component repaid in this transaction |
| `remaining_balance` | `i128` | Outstanding balance after repayment (0 if fully repaid) |

**Example JSON:**
```json
{
  "topics": [
    "loan_repaid",
    "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPGK7FHZM5YIOP7GKEUYFQVYW"
  ],
  "data": {
    "loan_id": 7,
    "principal_paid": "500000000",
    "interest_paid": "12500000",
    "remaining_balance": "500000000"
  }
}
```

---

### 4. `loan` / `liquidated`

Emitted by `liquidate` after a successful liquidation.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"loan"` | `Symbol` (`symbol_short!`) |
| 1 | `"liquidated"` | `Symbol` (`Symbol::new`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `loan_id` | `u64` | Loan ID that was liquidated |
| `liquidator` | `Address` | Address of the liquidator |
| `repay_amount` | `i128` | Amount repaid by the liquidator |
| `outstanding_after` | `i128` | Remaining outstanding balance after liquidation |
| `status` | `LoanStatus` | Final loan status (`Active` if partial, `Liquidated` if full) |

**Example JSON:**
```json
{
  "topics": ["loan", "liquidated"],
  "data": {
    "loan_id": 7,
    "liquidator": "GCK2YZ5MLGWDP27SQTJ5Y3DBVZLGQ3PZQLP24JB5JLXSKGZQZXWX2I",
    "repay_amount": "500000000",
    "outstanding_after": "0",
    "status": "Liquidated"
  }
}
```

---

### 5. `FeeCol` — Fee Collected

Emitted once per fee transfer inside `request_loan` (origination fee) and `repay_loan`
(interest fee). The second topic is the `loan_id` (`u64`), allowing per-loan fee tracking.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"FeeCol"` | `Symbol` (`symbol_short!`) |
| 1 | `loan_id` | `u64` |

**Data:**

| Field | Type | Description |
|---|---|---|
| `fee_type` | `Symbol` | `originate` or `interest` |
| `amount` | `i128` | Fee amount collected |

### `fee / cfgUpd`

Emitted by `update_fee_config` after a successful fee parameter change.

| Field | Type | Description |
|---|---|---|
| `old_origination_fee_bps` | `u32` | Previous origination fee in basis points |
| `old_interest_fee_bps` | `u32` | Previous interest fee in basis points |
| `new_origination_fee_bps` | `u32` | New origination fee in basis points |
| `new_interest_fee_bps` | `u32` | New interest fee in basis points |

## Naming Convention

Topics follow the pattern `(namespace, action)` using `symbol_short!` macros for
two-part events, or `(event_name, addr1, addr2)` when addresses are embedded in topics
for efficient indexed filtering:
| `fee_type` | `Symbol` | `"originate"` or `"interest"` |
| `amount` | `i128` | Fee amount transferred to the treasury |

**Example JSON (origination):**
```json
{
  "topics": ["FeeCol", 7],
  "data": {
    "fee_type": "originate",
    "amount": "5000000"
  }
}
```
(Symbol::new(&env, "collateral_registered"), owner)   // collateral registration
(symbol_short!("loan"),      symbol_short!("requested"))
(Symbol::new(&env, "loan_repaid"), borrower_address)
(symbol_short!("loan"),      symbol_short!("liquidated"))
(symbol_short!("fee"),       symbol_short!("cfgUpd"))

---

### 6. `fee` / `cfgUpd`

Emitted by `update_fee_config` after a successful fee parameter change.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"fee"` | `Symbol` (`symbol_short!`) |
| 1 | `"cfgUpd"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `old_origination_fee_bps` | `u32` | Previous origination fee (basis points) |
| `old_interest_fee_bps` | `u32` | Previous interest fee (basis points) |
| `new_origination_fee_bps` | `u32` | Updated origination fee (basis points) |
| `new_interest_fee_bps` | `u32` | Updated interest fee (basis points) |

**Example JSON:**
```json
{
  "topics": ["fee", "cfgUpd"],
  "data": {
    "old_origination_fee_bps": 50,
    "old_interest_fee_bps": 1000,
    "new_origination_fee_bps": 75,
    "new_interest_fee_bps": 900
  }
}
```

---

### 7. `collat` / `appraised`

Emitted by `update_appraisal` when a collateral record's appraised value is updated.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"collat"` | `Symbol` (`symbol_short!`) |
| 1 | `"appraised"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `collateral_id` | `u64` | ID of the updated collateral record |
| `new_value` | `i128` | New appraised value in token base units |

**Example JSON:**
```json
{
  "topics": ["collat", "appraised"],
  "data": {
    "collateral_id": 3,
    "new_value": "6000000000"
  }
}
```

---

### 8. `whitelist` / `added`

Emitted by `add_liquidator` when an address is approved as a liquidator.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"whitelist"` | `Symbol` (`symbol_short!`) |
| 1 | `"added"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `liquidator` | `Address` | Newly approved liquidator address |

**Example JSON:**
```json
{
  "topics": ["whitelist", "added"],
  "data": {
    "liquidator": "GCK2YZ5MLGWDP27SQTJ5Y3DBVZLGQ3PZQLP24JB5JLXSKGZQZXWX2I"
  }
}
```

---

### 9. `whitelist` / `removed`

Emitted by `remove_liquidator` when an address is removed from the whitelist.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"whitelist"` | `Symbol` (`symbol_short!`) |
| 1 | `"removed"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `liquidator` | `Address` | Removed liquidator address |

**Example JSON:**
```json
{
  "topics": ["whitelist", "removed"],
  "data": {
    "liquidator": "GCK2YZ5MLGWDP27SQTJ5Y3DBVZLGQ3PZQLP24JB5JLXSKGZQZXWX2I"
  }
}
```

---

### 10. `Admin` / `LtvUpd`

Emitted by `set_ltv` when the loan-to-value ratio is updated.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"LtvUpd"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `old_ltv_bps` | `u32` | Previous LTV in basis points |
| `new_ltv_bps` | `u32` | Updated LTV in basis points |

**Example JSON:**
```json
{
  "topics": ["Admin", "LtvUpd"],
  "data": {
    "old_ltv_bps": 6000,
    "new_ltv_bps": 6500
  }
}
```

---

### 11. `Admin` / `LoanLim`

Emitted by `set_loan_limits` when the min/max loan bounds are updated (Issue #700).

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"LoanLim"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `min_loan` | `i128` | New minimum loan amount in stroops |
| `max_loan` | `i128` | New maximum loan amount in stroops |

**Example JSON:**
```json
{
  "topics": ["Admin", "LoanLim"],
  "data": {
    "min_loan": "10000000",
    "max_loan": "1000000000000"
  }
}
```

---

### 12. `Admin` / `LiqThrUpd`

Emitted by `set_liquidation_threshold` when the liquidation threshold is updated.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"LiqThrUpd"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `new_threshold_bps` | `u32` | Updated liquidation threshold in basis points |

**Example JSON:**
```json
{
  "topics": ["Admin", "LiqThrUpd"],
  "data": {
    "new_threshold_bps": 8500
  }
}
```

---

### 13. `Admin` / `OracleUpd`

Emitted by `set_oracle` when the oracle address is replaced.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"OracleUpd"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `new_oracle` | `Address` | New oracle Stellar address |

**Example JSON:**
```json
{
  "topics": ["Admin", "OracleUpd"],
  "data": {
    "new_oracle": "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
  }
}
```

---

### 14. `Admin` / `PropNewAd`

Emitted by `propose_admin_transfer` when a new admin is nominated.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"PropNewAd"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `new_admin` | `Address` | Nominated admin address (pending acceptance) |

**Example JSON:**
```json
{
  "topics": ["Admin", "PropNewAd"],
  "data": {
    "new_admin": "GDGQVOKHW4VEJRU2TETD6DBAQTZZZVSHN6XNE72AXH36WMO1CJXR2JF"
  }
}
```

---

### 15. `Admin` / `AdminUpd`

Emitted by `accept_admin_transfer` when the admin role is transferred.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"AdminUpd"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `new_admin` | `Address` | Address that is now the active admin |

**Example JSON:**
```json
{
  "topics": ["Admin", "AdminUpd"],
  "data": {
    "new_admin": "GDGQVOKHW4VEJRU2TETD6DBAQTZZZVSHN6XNE72AXH36WMO1CJXR2JF"
  }
}
```

---

### 16. `Admin` / `MigDone`

Emitted by `migrate_storage` after the post-upgrade migration hook runs (Issue #699).

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Admin"` | `Symbol` (`symbol_short!`) |
| 1 | `"MigDone"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `migration_version` | `u32` | Version number of the migration that ran (currently `1`) |

**Example JSON:**
```json
{
  "topics": ["Admin", "MigDone"],
  "data": {
    "migration_version": 1
  }
}
```

---

### 17. `Pause`

Emitted by `pause` when the contract is paused.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Pause"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `expires_at` | `u64` | Ledger timestamp at which the pause auto-expires |

**Example JSON:**
```json
{
  "topics": ["Pause"],
  "data": {
    "expires_at": 1753430400
  }
}
```

---

### 18. `Unpause`

Emitted by `unpause` (or auto-expiry) when the contract resumes.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"Unpause"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `timestamp` | `u64` | Ledger timestamp at which the unpause occurred |

**Example JSON:**
```json
{
  "topics": ["Unpause"],
  "data": {
    "timestamp": 1753344000
  }
}
```

---

### 19. `StaleThr`

Emitted by `set_staleness_threshold` when the oracle price staleness limit is changed.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"StaleThr"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `threshold_seconds` | `u64` | New staleness threshold in seconds |

**Example JSON:**
```json
{
  "topics": ["StaleThr"],
  "data": {
    "threshold_seconds": 7200
  }
}
```

---

### 20. `TWAP` / `price`

Emitted by `submit_oracle_prices` after each successful oracle price aggregation.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"TWAP"` | `Symbol` (`symbol_short!`) |
| 1 | `"price"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `current_price` | `i128` | Most recent median price submitted |
| `twap_price` | `i128` | Updated time-weighted average price |
| `timestamp` | `u64` | Ledger timestamp of this submission |

**Example JSON:**
```json
{
  "topics": ["TWAP", "price"],
  "data": {
    "current_price": "1200000000",
    "twap_price": "1195000000",
    "timestamp": 1753344000
  }
}
```

---

### 21. `upgrade` / `proposed`

Emitted by `propose_upgrade` when a WASM upgrade is queued.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"upgrade"` | `Symbol` (`symbol_short!`) |
| 1 | `"proposed"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `wasm_hash` | `BytesN<32>` | SHA-256 hash of the proposed WASM binary |
| `execute_after` | `u64` | Earliest ledger timestamp the upgrade can be executed (now + 24 h timelock) |

**Example JSON:**
```json
{
  "topics": ["upgrade", "proposed"],
  "data": {
    "wasm_hash": "aabbccdd...",
    "execute_after": 1753430400
  }
}
```

---

### 22. `upgrade` / `executed`

Emitted by `execute_upgrade` after a WASM upgrade is applied.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"upgrade"` | `Symbol` (`symbol_short!`) |
| 1 | `"executed"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `timestamp` | `u64` | Ledger timestamp of the upgrade execution |

**Example JSON:**
```json
{
  "topics": ["upgrade", "executed"],
  "data": {
    "timestamp": 1753430400
  }
}
```

---

### 23. `upgrade` / `canceled`

Emitted by `cancel_upgrade` when a pending upgrade is cancelled.

**Topics:**

| Index | Value | Type |
|---|---|---|
| 0 | `"upgrade"` | `Symbol` (`symbol_short!`) |
| 1 | `"canceled"` | `Symbol` (`symbol_short!`) |

**Data:**

| Field | Type | Description |
|---|---|---|
| `timestamp` | `u64` | Ledger timestamp of the cancellation |

**Example JSON:**
```json
{
  "topics": ["upgrade", "canceled"],
  "data": {
    "timestamp": 1753344000
  }
}
```

---

## Backend Event Listener

`backend/src/contractEventListener.ts` polls `SorobanRpc.Server.getEvents()` on an
interval (`EVENT_POLL_INTERVAL_MS`, default 5 000 ms). It currently handles:

| Event | Handler action |
|---|---|
| `livestock` / `registered` | `insertCollateral` — creates collateral row in SQLite |
| `loan` / `requested` | `insertLoan` — creates loan row |
| `loan_repaid` | `updateLoan` — updates `outstanding` balance |
| `loan` / `liquidated` | `updateLoan` + `insertLiquidationEvent` — marks loan liquidated |

For full schema documentation of the above events see [§1](#1-livestock--registered)–[§4](#4-loan--liquidated).

Unhandled events (admin, fee, whitelist, upgrade, TWAP, pause) are logged at `debug`
level but not persisted. Extend `contractEventListener.ts` to handle additional events
as off-chain indexing requirements grow.

---

## Naming Conventions

| Pattern | Example | When used |
|---|---|---|
| `symbol_short!("name")` | `"livestock"`, `"loan"`, `"fee"` | Namespace / category; ≤ 8 ASCII bytes |
| `Symbol::new(&env, "name")` | `"registered"`, `"requested"` | Action; can be up to 32 bytes |
| `Address` in topics | `borrower` in `loan_repaid` | Enables RPC filtering by address |
| `u64` in topics | `loan_id` in `FeeCol` | Enables per-entity filtering |

---

*Last updated: 2026-07-24. Reflects contract version at HEAD of `main`.*

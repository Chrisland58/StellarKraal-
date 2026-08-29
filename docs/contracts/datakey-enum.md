# `DataKey` Enum — StellarKraal Contract Storage Reference

> Auto-generated from rustdoc comments in `contracts/stellarkraal/src/lib.rs`.
> Run `cargo doc --no-deps` from `contracts/stellarkraal/` to rebuild the HTML docs.

## Overview

`DataKey` is the persistent (and temporary) storage key enum used by the
StellarKraal contract.  Every value written to or read from Soroban storage
is addressed by one of these variants.

```rust
#[contracttype]
pub enum DataKey {
    Loan(u64),
    Collateral(u64),
    LoanCounter,
    CollateralCounter,
    Guard,
}
```

---

## Variants

### `Loan(u64)`

**Value type**: [`LoanRecord`](./stellarkraal-interface.md)

Full `LoanRecord` for the loan identified by the inner `u64` ID.  Written
by `request_loan` and updated by `repay_loan` and `liquidate`.  Read by
`get_loan`, `health_factor`, and `liquidate`.

Storage bucket: **persistent**

---

### `Collateral(u64)`

**Value type**: [`CollateralRecord`](./stellarkraal-interface.md)

Full `CollateralRecord` for the collateral identified by the inner `u64` ID.
Written by `register_livestock`.  Read and updated by `request_loan` (to lock
collateral to a loan).  Read by `get_collateral` and `get_loan_collaterals`.

Storage bucket: **persistent**

---

### `LoanCounter`

**Value type**: `u64`

Monotonically increasing counter used to assign unique loan IDs.  The value
stored is the *last assigned* ID; the next ID is `value + 1`.  Initialised to
`0` (first loan gets ID `1`).

Storage bucket: **instance** (via `next_id` helper)

---

### `CollateralCounter`

**Value type**: `u64`

Monotonically increasing counter used to assign unique collateral IDs.  The
value stored is the *last assigned* ID; the next ID is `value + 1`.
Initialised to `0` (first collateral record gets ID `1`).

Storage bucket: **instance** (via `next_id` helper)

---

### `Guard`

**Value type**: `()` (unit — presence is the signal)

Reentrancy guard flag stored in *temporary* storage.  Its mere presence
signals that a re-entrant call is already in progress.  Set by
`ReentrancyGuard::new` at the start of every state-mutating function and
cleared automatically when the guard is dropped at the end of that call.

Storage bucket: **temporary**

---

## Related types

| Type | Description |
|------|-------------|
| `LoanRecord` | On-chain loan record including principal, outstanding balance, accrued interest, and status |
| `CollateralRecord` | On-chain collateral record including owner, animal type, count, and appraised value |

See [`stellarkraal-interface.md`](./stellarkraal-interface.md) for the full
contract public API.

# ADR-007: Time-Weighted Average Price (TWAP) for Liquidation Price Feeds

**Date:** 2026-07-24  
**Status:** Accepted

## Context

[ADR-006](ADR-006-oracle-design.md) documents the multi-oracle median aggregation strategy for the StellarKraal price feed. ADR-006 mentions TWAP in passing but does not record the decision to use it as a dedicated mechanism. The TWAP subsystem was added to the contract (`set_twap_window`, `submit_price` feeding a rolling average, `get_twap_data`) without a dedicated ADR capturing the why, the design choices, and the trade-offs. This ADR fills that gap.

The core problem TWAP solves is **flash loan price manipulation**:

- A spot-price oracle is vulnerable to single-block attacks where an adversary flash-borrows a large amount of a collateral token, crashes its price on a DEX in the same transaction, triggers liquidation of under-collateralized loans, and repays the flash loan — all atomically.
- Using spot price for liquidation collateral valuation exposes the protocol to this attack vector.
- The livestock collateral in StellarKraal has no liquid on-chain DEX, but the same risk applies to any token-denominated price submitted by oracles: a single malicious or erroneous price submission should not instantly make positions liquidatable.

A related concern is **oracle liveness and staleness**: if no price has been submitted recently, the collateral value used in liquidation decisions may be arbitrarily old.

ADR-006 already addressed *aggregation* (median across multiple oracles, quorum enforcement). This ADR addresses *temporal smoothing* (averaging over time within the single-oracle price path).

## Decision

We implement a **rolling TWAP window** over oracle price submissions and use the TWAP — not the spot price — as the authoritative collateral value for liquidation decisions.

### Mechanism

1. Every call to `submit_price(oracle, price, price_timestamp)` is validated (bounds, staleness, deviation — see ADR-006) and, if accepted, appended to an in-storage price history keyed by timestamp.
2. On each submission, the contract recomputes the TWAP as the simple arithmetic mean of all prices whose timestamp falls within the current window:

   ```
   TWAP = sum(prices in window) / count(prices in window)
   ```

3. The **window** is configurable by the admin via `set_twap_window(admin, window_seconds)`. The default is **3,600 seconds (1 hour)**.
4. When a new price arrives outside the previous window (i.e., the window has expired and rolled), the history is reset and the TWAP initialises with only the new price.
5. `get_twap_data()` returns a `TWAPData` struct with three fields:
   - `current_price` — the most recently accepted spot price.
   - `twap_price` — the rolling average over the window.
   - `last_update` — the ledger timestamp of the last accepted submission.

### Liquidation uses TWAP; loan origination uses spot with a sanity check

```
Liquidation  →  collateral_value = collateral_count × twap_price
Origination  →  collateral_value = collateral_count × current_price
               (guarded: if current_price > twap_price × (1 + max_deviation_bps/10_000)
                         → revert PriceDeviationExceeded)
```

This split is intentional:

- **Liquidations** must be manipulation-resistant. TWAP averaging over an hour means a single-block or even a 30-minute coordinated attack cannot crash the effective collateral price enough to trigger profitable liquidation.
- **Originations** can use the spot price for responsiveness (so borrowers see current market values), but the deviation check prevents exploiting a temporarily inflated spot price to borrow against over-valued collateral.

### Window configuration guidance

| Use case | Recommended window | Rationale |
|----------|--------------------|-----------|
| Default / volatile livestock prices | 3,600 s (1 hour) | Smooths short-term volatility; flash attacks within an hour are blocked |
| Stable tracked asset | 1,800 s (30 min) | Faster response to genuine market moves |
| Maximum conservatism | 14,400 s (4 hours) | Maximises manipulation resistance at the cost of price lag |

## Alternatives Considered

| Option | Reason not chosen |
|--------|-------------------|
| **Spot price for liquidations** | Directly vulnerable to flash loan attacks and oracle key compromise causing a single bad submission to trigger mass liquidation. Acceptable only in a prototype without real collateral. |
| **Median TWAP (time-weighted median)** | Median across time-series submissions would be more robust to outliers than a simple mean, but requires storing the full ordered series and sorting in-contract — prohibitive gas cost on Soroban for a rolling window. The `max_deviation_bps` guard on individual submissions is simpler and catches the same outlier class. |
| **External TWAP oracle (e.g. Uniswap V2-style on-chain accumulator)** | Requires a liquid on-chain market for livestock collateral tokens. No such market exists. The Soroban TWAP is computed from off-chain appraiser submissions, which is the only feasible data source for this asset class. |
| **No smoothing — just staleness threshold** | A staleness check (`staleness_threshold` in `OracleConfig`) prevents very old prices but does not protect against a rapid manipulation that arrives within the staleness window. TWAP adds temporal averaging on top of staleness control; both are needed. |
| **Geometric TWAP** | More representative for multiplicative price dynamics, but introduces complexity and potential overflow on Soroban's `i128` arithmetic. The arithmetic mean is sufficient for the expected magnitude of livestock price fluctuations. |

## Consequences

**Positive:**

- A single malicious or erroneous price submission cannot immediately shift the TWAP enough to trigger liquidation — an attacker must sustain a price move for the duration of the window.
- The spot/TWAP split is surfaced in `TWAPData`, giving monitoring tools a simple signal: a large divergence between `current_price` and `twap_price` is an early indicator of manipulation or a genuine fast-moving market.
- `set_twap_window` allows the admin to tune the window without a contract upgrade, so the trade-off between responsiveness and manipulation resistance can be adjusted as the protocol matures.
- TWAP and staleness + deviation controls from ADR-006 compose into layered defences: a price must be fresh (staleness), close to the previous price (deviation), and sustained over time (TWAP) to move the authoritative liquidation price.

**Negative / Trade-offs:**

- TWAP lags real market prices. In a genuine fast-moving crash, the liquidation price will be higher than spot for up to one window period, meaning some undercollateralised positions may not be liquidatable immediately. This is an acceptable trade-off: it protects borrowers from flash attacks at the cost of slightly delayed liquidations in real downturns.
- The simple arithmetic mean is influenced by extreme values within the window (unlike the median used in multi-oracle aggregation). The `max_deviation_bps` per-submission guard partially mitigates this, but a sustained series of slightly-inflated prices from a single oracle can still drift the TWAP.
- Window expiry resets the TWAP to a single price, creating a short window where the TWAP equals the spot price. During this reset moment, the anti-flash-loan property is temporarily weakened. Mitigation: require a minimum of two submissions before using TWAP for liquidations (not currently implemented; noted as a future improvement).
- Admin control over `set_twap_window` and `set_oracle_config` means an admin key compromise can degrade temporal protection. Addressed by governance controls (multisig/timelock) outside the contract, as noted in ADR-006.

## Security Considerations

- **Flash loan protection:** Documented above. TWAP averaging over 1 hour makes single-block price crashes ineffective for triggering liquidation.
- **Sustained attack / gradual manipulation:** TWAP does not protect against an attacker who controls the oracle for the entire window duration, or who moves the price gradually over multiple windows. This is the same residual risk identified in ADR-006 for multi-oracle collusion. Mitigated by oracle governance (quorum, flagging, removal).
- **Window reset race:** After a window expires, the TWAP is briefly equal to the single newest price. This window is short (one price submission interval) but should be noted by integrators and monitoring tools.
- **`max_deviation_bps` interaction:** If the deviation guard is set too tightly, legitimate rapid price moves will cause `PriceDeviationExceeded` and leave the TWAP stale. Operators must tune this parameter to balance responsiveness with manipulation resistance.

## Notes

- Implementation: `contracts/stellarkraal/src/lib.rs` — `submit_price`, `set_twap_window`, `get_twap_data`, `TWAPData` struct, `OracleConfig` struct.
- Full technical specification: [docs/protocol/twap-mechanism.md](../protocol/twap-mechanism.md).
- Related ADRs: [ADR-005](ADR-005-collateral-appraisal-model.md) (off-chain appraisal model), [ADR-006](ADR-006-oracle-design.md) (multi-oracle median aggregation).
- Related docs: [docs/contracts/stellarkraal-interface.md](../contracts/stellarkraal-interface.md), [docs/protocol/liquidation.md](../protocol/liquidation.md).

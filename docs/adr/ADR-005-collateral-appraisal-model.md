# ADR-005: Use Off-Chain Appraisal Values for Collateral Valuation

**Date:** 2026-05-30
**Status:** Accepted

## Context

StellarKraal requires reliable collateral valuation to permit loans against livestock assets.
The smart contract must enforce collateral-backed loan limits without incurring excessive on-chain complexity or dependence on a fully decentralized price oracle.

The contract currently supports an external oracle address and validation rules for submitted prices, but the underlying appraisal model can be implemented in multiple ways:

- on-chain oracle feeds with decentralized aggregation,
- off-chain appraisal values submitted by a trusted service,
- fixed or synthetic price references baked into the contract.

Constraints:

- Soroban on-chain oracle infrastructure is still evolving and can be expensive to maintain.
- Livestock appraisal requires specialized off-chain data that is easiest to produce outside the contract.
- The backend must be able to prevent unsafe loan issuance and preserve recoverability in the face of stale or incorrect price submissions.

Unlike fungible crypto assets, livestock has **no liquid on-chain market and no public price feed**. A cow's value depends on breed, weight, age, health, and regional market conditions — data that only exists off-chain and is produced by professional appraisers and market data services. This makes a purely on-chain appraisal model structurally infeasible at the current stage.

## Decision

We decided to use off-chain appraisal values and a trusted oracle submission flow rather than fully on-chain oracles.

The contract accepts price submissions from an authorized `oracle` address and validates them using configurable bounds, staleness thresholds, and deviation limits. It also maintains a TWAP window for smoother pricing state.

This approach keeps the smart contract logic simpler and more auditable while still enforcing meaningful on-chain constraints.

The off-chain appraisal pipeline (`backend/src/utils/appraisalCache.ts`) acts as a convenience cache for UX and loan pre-checks, but is **never authoritative for on-chain enforcement**. All fund-gating decisions are made against the on-chain price enforced by the contract.

This decision was subsequently extended by:
- [ADR-006](ADR-006-oracle-design.md) — which adds multi-oracle median aggregation on top of this single-oracle model.
- [ADR-007](ADR-007-oracle-twap.md) — which formalises the TWAP mechanism for manipulation-resistant liquidation pricing.

## Alternatives Considered

| Option | Reason not chosen |
|--------|-------------------|
| Fully on-chain decentralized oracle feed | Requires more complex contract logic and on-chain infrastructure that is not yet stable for livestock pricing. No established decentralized oracle (e.g. Chainlink, Pyth) quotes livestock prices, so this would still require an off-chain appraisal pipeline feeding it — adding cost and dependency without removing the core problem. Also increases gas costs and attack surface. |
| Fixed on-chain valuations / static price table | Too inflexible for real-world livestock markets. Would not support dynamic loan pricing as collateral values change over time, risking systematic under- or over-collateralization at scale. |
| Hybrid fallback to multiple off-chain oracles | Adds operational complexity and still requires off-chain coordination. The initial MVP favours a simpler single trusted oracle with on-chain validations. Multi-oracle design was revisited later in ADR-006. |
| No oracle / fixed LTV value only | Does not reflect actual collateral risk and may cause under-collateralization or overly conservative lending limits. Unacceptable for real-value livestock lending. |

## Risks

The following risks are introduced by the off-chain appraisal model:

### R1 — Operator trust and single point of failure

The initial model relies on a single authorized oracle address. If that key is compromised or the operator submits incorrect values (deliberately or by bug), the protocol can be drained via under-collateralized loans or unjust liquidations. This is the dominant risk of this architecture.

**Severity:** High. **Likelihood:** Low (with good key management), Medium (for bugs in the appraisal pipeline).

### R2 — Price staleness

If the oracle service goes offline or fails to submit a fresh price, the on-chain price becomes stale. Stale prices may cause `PriceStale` errors on loan origination, or — if staleness checks are misconfigured — allow an outdated price to be used.

**Severity:** Medium. **Likelihood:** Medium (any off-chain service can have availability issues).

### R3 — Appraisal pipeline accuracy

Livestock appraisals are produced by external services based on weight, breed, health, and regional market data. Errors in data ingestion, model calibration, or currency conversion can produce incorrect appraised values that flow into oracle submissions.

**Severity:** Medium to High. **Likelihood:** Low (with audited appraisal methodology), but non-zero.

### R4 — Flash manipulation via a single oracle submission

A single malicious or erroneous price submission could, in the absence of temporal smoothing, immediately make positions liquidatable or prevent liquidation of genuinely unsafe positions.

**Severity:** High. **Likelihood:** Low (mitigated by TWAP — see ADR-007).

### R5 — Off-chain cache divergence

The `appraisalCache.ts` in-memory cache (default 5-minute TTL) may serve stale appraisal values for UX and pre-checks. If cache invalidation on oracle update is missed, borrowers may see incorrect collateral values in the UI.

**Severity:** Low (cache never gates funds). **Likelihood:** Medium (cache invalidation logic requires discipline).

### R6 — Admin key compromise

The admin controls oracle registration (`add_oracle`, `remove_oracle`), TWAP window (`set_twap_window`), and oracle config (`set_oracle_config`). Compromise of the admin key can degrade all oracle safeguards.

**Severity:** Critical. **Likelihood:** Low (with proper key management).

## Mitigations

| Risk | Mitigation |
|------|------------|
| R1 — Single oracle trust | Superseded by multi-oracle design (ADR-006): up to 5 registered oracles, quorum enforcement (`min(3, n)`), and on-chain median aggregation. A single compromised oracle can no longer move the price unilaterally. |
| R2 — Price staleness | `staleness_threshold` in `OracleConfig` rejects submissions older than the configured window. `PriceStale` is returned to callers. Monitoring of `last_update` in `TWAPData` surfaces liveness issues. |
| R3 — Appraisal accuracy | `price_min` / `price_max` bounds reject out-of-range submissions. `max_deviation_bps` rejects prices that jump too far from the last accepted price. External appraisal methodology should be independently audited. |
| R4 — Flash manipulation | TWAP over a configurable window (default 1 hour) is used for liquidation pricing — see [docs/protocol/twap-mechanism.md](../protocol/twap-mechanism.md) and ADR-007. A single block or short-window price move cannot trigger profitable liquidation. |
| R5 — Cache divergence | `invalidateAppraisal(collateralId)` and `invalidateAll()` are called on oracle price updates. Cache is documented as non-authoritative in code and docs. |
| R6 — Admin key | Governance recommendation: protect the admin key with a multisig wallet or timelock before mainnet. This is an operational control outside the contract. |

The combined effect of these mitigations is a layered defence: prices must be fresh (staleness), within plausible bounds (min/max), not sharply deviated (deviation bps), submitted by a quorum of oracles (ADR-006), and sustained over time (TWAP, ADR-007) before they can gate funds.

## On-Chain Alternatives

The following on-chain alternatives were evaluated and remain relevant for future upgrades:

**Decentralized on-chain oracle network (e.g. Band Protocol, DIA):** Would remove the need for a trusted off-chain submitter if a livestock price feed existed. No such feed currently exists. Revisit if a livestock data feed emerges on Stellar.

**On-chain staking and slashing for oracle submitters:** Oracles stake tokens as collateral against correct behaviour; malicious submissions are penalized by slashing. Increases economic security but requires significant additional contract complexity. Not warranted for current scale. The `flagged_count` field in `OracleReport` (ADR-006) provides the dispute-detection primitive a slashing system could build on.

**Commit-reveal price schemes:** Oracles commit to a price hash then reveal after a delay, preventing front-running. Adds round-trip latency unsuitable for livestock pricing where sub-minute freshness is not required. Could be revisited for high-frequency extensions.

**Threshold signature / MPC oracle networks:** Multiple parties jointly sign a price report so no single party holds a complete signing key. Maximises manipulation resistance but operationally complex. Noted as a long-term option for mainnet at scale.

## Oracle Integration

This ADR is implemented alongside two further decisions that define the full oracle stack:

- **[ADR-006](ADR-006-oracle-design.md)** — Multi-oracle median aggregation: how multiple oracles are registered, how the on-chain median is computed, and how the off-chain appraisal cache relates to the authoritative on-chain price.
- **[ADR-007](ADR-007-oracle-twap.md)** — TWAP mechanism: how submitted prices are smoothed over time to resist flash manipulation, and why TWAP is used for liquidations while spot price is used for origination.

The TWAP mechanism is fully documented at **[docs/protocol/twap-mechanism.md](../protocol/twap-mechanism.md)**.

Contract entry points relevant to this decision:

| Entry point | Purpose |
|-------------|---------|
| `submit_price(oracle, price, price_timestamp)` | Single-oracle price submission with bounds/staleness/deviation validation |
| `submit_oracle_prices(submitter, prices)` | Multi-oracle median submission (ADR-006) |
| `set_oracle_config(admin, config)` | Configure price bounds, staleness threshold, max deviation |
| `set_twap_window(admin, window_seconds)` | Configure TWAP smoothing window |
| `get_twap_data()` | Returns `{ current_price, twap_price, last_update }` |

## Consequences

**Positive:**

- Minimises smart contract complexity and audit surface.
- Reduces Soroban execution cost by avoiding on-chain aggregation logic.
- Enables real-world livestock appraisals to be produced by external services with domain expertise.
- Retains on-chain validation for submitted prices via `submit_price`, `set_oracle_config`, and TWAP state.
- The off-chain/on-chain split is explicit: the cache can fail or be stale without ever endangering funds.
- Layered defences (bounds, staleness, deviation, quorum, TWAP) compose into defence-in-depth against manipulation and errors.

**Negative / Trade-offs:**

- Introduces reliance on an off-chain oracle service and operator trust (mitigated by multi-oracle design in ADR-006).
- Requires operational monitoring of price submission freshness and deviation thresholds.
- Off-chain data availability becomes a critical dependency for loan origination.
- Admin key compromise can degrade all oracle safeguards; requires governance controls (multisig/timelock) outside the contract.
- Two price representations (off-chain cache vs. on-chain price) require disciplined cache invalidation.

**Latest design state:**

The single-oracle model described in this ADR has been extended to a multi-oracle median design (ADR-006) with TWAP smoothing (ADR-007). The single `ORACLE` address is retained for backward compatibility but the preferred path is the registered oracle set (`add_oracle` / `remove_oracle`). The combination of median aggregation, quorum enforcement, per-submission validation, and TWAP makes the oracle stack significantly more robust than the initial MVP described here.

## Notes

- Implementation reference: `contracts/stellarkraal/src/lib.rs`.
- The contract uses `Error::PriceStale`, `Error::PriceDeviationExceeded`, `Error::PriceBelowMin`, and `Error::PriceAboveMax` to guard oracle updates.
- Off-chain reference: `backend/src/utils/appraisalCache.ts`.
- Related: [ADR-006](ADR-006-oracle-design.md), [ADR-007](ADR-007-oracle-twap.md), [docs/protocol/twap-mechanism.md](../protocol/twap-mechanism.md), [docs/contracts/stellarkraal-interface.md](../contracts/stellarkraal-interface.md).

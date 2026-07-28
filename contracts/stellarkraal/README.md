# StellarKraal Smart Contract

Livestock-backed micro-lending protocol on Stellar/Soroban.

This crate implements the on-chain loan lifecycle: collateral registration, loan origination,
repayment, liquidation, oracle price feeds, and governance (pause, admin transfer, WASM upgrade).

## Quick Start

```bash
# Build the contract WASM
stellar contract build

# Run all tests
cargo test

# Run with coverage (requires cargo-llvm-cov)
cargo llvm-cov --all-features --workspace

# Run fuzz targets (requires cargo-fuzz + nightly)
cargo +nightly fuzz run fuzz_loan_operations
```

## Documentation

| Document | Description |
|---|---|
| [CHANGELOG](CHANGELOG.md) | Release history, unreleased changes, known limitations, and breaking-change policy |
| [Smart Contract Interface](../../docs/contracts/stellarkraal-interface.md) | Full public API reference: signatures, parameters, return types, error codes |
| [DataKey Enum Reference](../../docs/contracts/datakey-enum.md) | Storage key enumeration used for persistent and instance storage |
| [Loan State Machine](../../docs/protocol/loan-state-machine.md) | Valid loan states and transitions |
| [Liquidation Mechanism](../../docs/protocol/liquidation.md) | Health factor formula and liquidation flow |
| [TWAP Mechanism](../../docs/protocol/twap-mechanism.md) | Time-weighted average price implementation |
| [ADR-001 — Soroban](../../docs/adr/ADR-001-soroban.md) | Decision to use Soroban for on-chain loan lifecycle |
| [ADR-006 — Oracle Design](../../docs/adr/ADR-006-oracle-design.md) | Multi-oracle median aggregation |
| [ADR-007 — Oracle TWAP](../../docs/adr/ADR-007-oracle-twap.md) | TWAP for liquidation price feeds |
| [Fuzzing Guide](../../docs/testing/fuzzing.md) | Property-based and fuzz testing strategy |

## Deployment

See [Contract Deployment Guide](../../docs/deployment/contract-deployment.md) for step-by-step
deployment instructions using `stellar-cli`.

## Versioning and ABI Compatibility

This project follows [Semantic Versioning](https://semver.org/).

| Version type | ABI guarantee |
|---|---|
| Patch (1.0.x) | Fully backward compatible |
| Minor (1.x.0) | May add parameters with defaults; migration notes provided |
| Major (x.0.0) | May break ABI; migration guide required |

See [CHANGELOG.md](CHANGELOG.md) for the full breaking-change policy.

# Contributing to StellarKraal

Thank you for helping improve StellarKraal! This guide covers the commit convention, branching strategy, and automated release process.

---

## Commit Convention — Conventional Commits

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This is required for the automated changelog and semantic versioning to work correctly.

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use | Version bump |
|------|-------------|--------------|
| `feat` | New feature | minor |
| `fix` | Bug fix | patch |
| `docs` | Documentation only | patch |
| `refactor` | Code change with no feature/fix | patch |
| `test` | Adding or fixing tests | patch |
| `chore` | Build, CI, tooling changes | patch |
| `perf` | Performance improvement | patch |
| `BREAKING CHANGE` | Footer or `!` after type | major |

### Examples

```bash
feat(loans): add partial repayment support
fix(wallet): handle Freighter connection timeout
docs: update FAQ with liquidation questions
feat!: change collateral ID format (BREAKING CHANGE)
```

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code; triggers release-please |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Tooling, CI, dependency updates |

Open a pull request from your branch into `main`. Squash-merge to keep history clean.

---

## Automated Release Process (release-please)

This project uses [release-please](https://github.com/googleapis/release-please) to automate releases.

### How it works

1. You push Conventional Commits to `main`.
2. The `release-please` GitHub Actions workflow (`.github/workflows/release-please.yml`) opens a **Release PR** that:
   - Bumps the version in `package.json` following semver rules.
   - Updates `CHANGELOG.md` with entries grouped by type.
3. When the Release PR is merged, release-please:
   - Creates a **GitHub Release** with the changelog notes.
   - Tags the commit (e.g. `v1.2.0`).

### Manual steps (none required for normal releases)

If you need to cut a release manually, merge the open Release PR created by release-please. Do **not** manually edit the versioned release headers in `CHANGELOG.md` — those are auto-generated.

When your PR changes user-facing behavior, add a bullet to the `[Unreleased]` section
yourself following [docs/guides/changelog.md](docs/guides/changelog.md).

---

## Development Setup

> **New contributor?** Start with the **[Contributing Quickstart](docs/development/contributing-quickstart.md)** — it walks you through cloning, installing dependencies, running tests, and opening your first PR on a clean Ubuntu 22.04 or macOS install.

```bash
# Clone
git clone https://github.com/teslims2/StellarKraal-.git
cd StellarKraal-

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# Smart contract (requires Rust + stellar-cli)
stellar contract build
```

## Running Tests

```bash
npm run test:frontend   # Jest component tests
npm run test:backend    # Backend unit + integration tests
npm run test:contract   # Soroban contract tests
npm run test:e2e        # Playwright E2E tests
```

For detailed instructions on running E2E tests locally, see [E2E Testing Guide](docs/testing/e2e-tests.md).

## Managing Dependencies

Before adding a new dependency, run `depcheck` to confirm it is not already available:

```bash
# Check for unused dependencies (run from the relevant subdirectory)
npx depcheck frontend
npx depcheck backend
```

Remove any packages flagged as unused before opening a PR. This keeps install time, bundle size, and attack surface minimal.

---

## Smart Contract Changes

The on-chain logic lives in `contracts/stellarkraal/` and is written in Rust using the
[Soroban SDK](https://developers.stellar.org/docs/tools/sdks/library-sdk).

### Rust Toolchain Setup

The contract pins a specific toolchain in `contracts/stellarkraal/rust-toolchain.toml`. Rust will
automatically download and activate the correct version when you run any Cargo command inside the
contract directory.

```bash
# Install rustup if you do not have it
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add the WebAssembly target (required to build a Soroban contract)
rustup target add wasm32-unknown-unknown

# Install stellar-cli (version 22+ required)
cargo install --locked stellar-cli --features opt
```

Verify your setup:

```bash
rustc --version      # should match rust-toolchain.toml
stellar --version    # should be 22.x or higher
```

### Running Contract Tests

```bash
cd contracts/stellarkraal

# Unit and integration tests (no network required)
cargo test

# With output visible on failures
cargo test -- --nocapture

# Run a specific test
cargo test test_register_collateral
```

All tests must pass before opening a PR. CI runs `cargo test` via
`.github/workflows/rust-ci.yml`.

### Building the WASM

```bash
cd contracts/stellarkraal

# Debug build (fast, larger file)
cargo build --target wasm32-unknown-unknown

# Release build (optimised, required for deployment)
stellar contract build
```

The optimised WASM is written to
`contracts/stellarkraal/target/wasm32-unknown-unknown/release/stellarkraal.wasm`.

### When an ADR Is Required

Open an [Architecture Decision Record](docs/adr/) in `docs/adr/` whenever a contract change:

- Alters the public ABI (adds, removes, or changes the signature of any `#[contractimpl]` function)
- Changes persistent storage layout (adds or renames a `DataKey` variant)
- Introduces a new oracle, price feed, or liquidation mechanism
- Modifies governance or admin controls (pause, upgrade, admin transfer)
- Involves a breaking protocol change that requires a migration guide

Copy `docs/adr/template.md`, increment the number, fill in all sections, and add a row to the ADR
table in `README.md`. Reference the ADR in your PR description.

> **New to ADRs?** See **[docs/adr/template.md](docs/adr/template.md)** for a filled example and a step-by-step guide covering when to write an ADR, what to put in each section, and how the review process works.

For non-breaking additions (new error codes, comment changes, test improvements) an ADR is not
required, but a clear PR description is expected.

### Deploy to Testnet

> See [Contract Deployment Guide](docs/deployment/contract-deployment.md) for the full step-by-step.

Quick reference:

```bash
# Generate a deployer identity (only needed once)
stellar keys generate deployer --network testnet

# Fund via Friendbot
curl "https://friendbot.stellar.org?addr=$(stellar keys address deployer)"

# Build the optimised WASM
stellar contract build

# Deploy
stellar contract deploy \
  --wasm contracts/stellarkraal/target/wasm32-unknown-unknown/release/stellarkraal.wasm \
  --source deployer \
  --network testnet
```

The command prints a `CONTRACT_ID`. Set `CONTRACT_ID=<value>` in your backend `.env` to point
the local stack at the newly deployed contract.

Testnet state is reset periodically by Stellar. Always test on testnet before proposing mainnet
deployments. Mainnet deployments require an additional review gate; see the deployment guide.

### Soroban SDK Documentation

- [Soroban SDK (Rust)](https://docs.rs/soroban-sdk/latest/soroban_sdk/)
- [Stellar Developer Docs — Smart Contracts](https://developers.stellar.org/docs/smart-contracts)
- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)

---

## Reviewer Checklist

Before approving a pull request, reviewers should confirm:

- [ ] PR title and commits follow Conventional Commits
- [ ] Change is scoped to the linked issue (no unrelated diffs)
- [ ] Frontend changes respect the [design token system](docs/guides/design-tokens.md) and pass light/dark mode checks
- [ ] Backend changes include input validation at API boundaries
- [ ] Soroban contract changes preserve backward-compatible ABI, or document a migration path
- [ ] New/changed logic has corresponding tests (Jest, backend, or `cargo test` as applicable)
- [ ] No secrets, private keys, or credentials are hardcoded
- [ ] Docs updated if behavior, setup, or environment variables changed
- [ ] CI is green

## Reporting Issues

- **Bugs**: Open a [GitHub issue](https://github.com/teslims2/StellarKraal-/issues/new?template=bug_report.md).
- **Security vulnerabilities**: Follow the responsible disclosure process in `SECURITY.md`.
- **Feature requests**: Open an issue with the `enhancement` label.

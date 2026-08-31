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

## Code Review

Explicit review guidelines align expectations for everyone involved and help keep review cycles short. This section covers what reviewers look for, how to give constructive feedback, the review SLA, and the responsibilities of both authors and reviewers.

---

### Author Responsibilities

Before requesting review, the PR author should:

- [ ] Self-review the diff — read every changed line as if you were a reviewer seeing it for the first time.
- [ ] Ensure CI is green and all tests pass locally.
- [ ] Write a clear PR description: what changed, why, and how to test it.
- [ ] Link the issue being resolved (e.g. `Closes #1234`).
- [ ] Keep the PR focused — one logical change per PR. Split unrelated fixes into separate PRs.
- [ ] Respond to review comments within one business day. If a comment requires discussion, start a thread rather than leaving it unresolved.
- [ ] Mark conversations as resolved only after addressing the feedback (not just to clear the UI).
- [ ] Request re-review after pushing substantive changes.

---

### Reviewer Responsibilities

Reviewers are expected to:

- [ ] Provide a first response within **2 business days** of the review request (see [SLA](#review-sla)).
- [ ] Check out the branch and run the tests locally for non-trivial changes.
- [ ] Give specific, actionable feedback — point to the line, explain the concern, and suggest an alternative when possible.
- [ ] Distinguish between blocking issues and suggestions (see [Comment Conventions](#comment-conventions)).
- [ ] Approve only when all blocking issues are resolved.
- [ ] Not re-open resolved conversations without adding new information.

---

### What to Check

Review every PR against the following dimensions:

#### Correctness
- Does the code do what the PR description says it does?
- Are edge cases (empty arrays, null values, network timeouts) handled?
- Are error paths tested, not just the happy path?

#### Tests
- Is there a test for the new behaviour or bug fix?
- Do the tests cover the most likely failure modes?
- Are existing tests left green (no skipped tests without a tracked issue)?

#### Security
- Are all inputs validated and sanitized at API boundaries?
- Are SQL queries parameterized (no string interpolation into queries)?
- Are secrets read from environment variables, not hardcoded?
- Does the change introduce any new permissions or access control implications?
- Are JWTs verified before trusting their claims?

#### Documentation
- If the PR changes a public API, environment variable, or user-facing behavior, is the relevant documentation updated?
- Are new functions and exported types documented with JSDoc or inline comments?

#### Performance
- Does the change introduce N+1 queries or unbounded loops over database results?
- Are large payloads paginated or projected?
- Does the change add a synchronous/blocking call on the hot path?

#### Style and Maintainability
- Is the code readable without needing to read the full diff context?
- Are variable and function names clear?
- Is the change consistent with the project's existing patterns (error handling style, response shapes, etc.)?

---

### Comment Conventions

Use prefixes to signal the urgency of a comment, so the author can triage quickly:

| Prefix | Meaning |
|--------|---------|
| `blocking:` | Must be addressed before approval. This indicates a correctness, security, or test gap. |
| `nit:` | Minor style or naming preference. Non-blocking; the author can address it or leave a reason for not doing so. |
| `question:` | Genuine curiosity — the reviewer wants to understand the decision. Non-blocking. |
| `suggestion:` | An alternative approach worth considering. Non-blocking; the author decides. |
| `note:` | Context or background the author might find useful. No action required. |

**Examples:**

```
blocking: This query is not parameterized. `userId` is concatenated directly into the SQL string,
which opens a SQL injection vector. Use `db.prepare('SELECT * FROM users WHERE id = ?').get(userId)` instead.

nit: Prefer `const` over `let` here since the variable is never reassigned.

suggestion: We could cache this response with `setResponseCache` to avoid the extra DB round-trip
on repeated reads. Not critical for this PR — could be a follow-up.
```

---

### Tone and Constructive Feedback

Code review is about the code, not the person. The goal is a better product, not winning an argument.

**Do:**
- Frame concerns as questions when you're not certain ("Is this safe to do if X is null?")
- Acknowledge good decisions ("Nice use of the existing cache here.")
- Explain the *why* behind a blocking comment, not just the *what*.
- Assume good intent — the author likely had a reason for their approach.

**Avoid:**
- Directives without explanation ("Change this.") — always explain why.
- Sarcasm or condescension ("This is obviously wrong.").
- Commenting on author style preferences unrelated to the project's conventions.
- Piling on after another reviewer has already raised the same concern — use a 👍 reaction instead.

If a review thread becomes heated or unproductive, take it to a synchronous conversation (call or pairing session) and post a summary back in the PR for the record.

---

### Review SLA

| Milestone | Target |
|-----------|--------|
| First response (acknowledge or initial review) | Within **2 business days** of review request |
| Re-review after author updates | Within **1 business day** of re-review request |
| Final approval or explicit block | Within **2 business days** of the last change set |

If a reviewer cannot meet the SLA (e.g., on leave, blocked by other priorities), they should:
1. Comment on the PR explaining the delay and expected return date.
2. Or reassign the review to another team member.

PRs that have had no reviewer activity for more than 3 business days may be escalated by the author to the #engineering Slack channel.

---

### Minimum Approvals

| Change type | Required approvals |
|-------------|--------------------|
| Documentation-only change | 1 |
| Backend or frontend feature/fix | 1 |
| Soroban contract change | 2 (including at least one smart-contract reviewer) |
| Infrastructure / Terraform change | 2 (including at least one infrastructure reviewer) |
| Security-sensitive change (auth, secrets, IAM) | 2 (including at least one security reviewer) |

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
- **Security vulnerabilities**: Follow the responsible disclosure process in [SECURITY.md](../SECURITY.md).
- **Feature requests**: Open an issue with the `enhancement` label.

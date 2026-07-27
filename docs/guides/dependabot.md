# Handling Dependabot Pull Requests

`.github/dependabot.yml` configures weekly automated dependency update PRs for three
ecosystems: `/backend` (npm), `/frontend` (npm), and `/contracts/stellarkraal` (cargo).
All Dependabot PRs are assigned to `teslims2` and labeled by ecosystem plus `dependencies`.

## Triage process

1. **Check the label** to identify the ecosystem (`backend`, `frontend`, or
   `smart-contract`) and whether it's `security`.
2. **Security-labeled PRs are high priority** — review and merge within a few days.
3. **Grouped updates**: each ecosystem groups all matching packages into a single PR
   (see the `groups` block in `dependabot.yml`), so one PR may bump several packages.

## Review checklist

- Read the linked release notes / changelog for breaking changes.
- Let CI run fully (build, lint, tests) before merging.
- For `backend` and `frontend`: confirm the app still builds and existing tests pass.
- For `contracts/stellarkraal`: confirm `cargo test` and contract benchmarks still pass
  (see `docs/PERFORMANCE_BENCHMARKS.md`).
- Major version bumps of `next` and `soroban-sdk` are intentionally excluded
  (`ignore` rules) and must be upgraded manually with a dedicated migration PR — do not
  remove the `ignore` rule without a plan for that migration.
- `db-migrate` / `db-migrate-sqlite3` major bumps are also ignored due to SQLite3 native
  binding compatibility — leave pinned unless you've verified compatibility.

## Merging

- Squash-merge once CI is green and the review checklist is satisfied.
- If a PR fails CI due to an incompatible major bump that isn't already ignored, close it
  and add an `ignore` rule in `.github/dependabot.yml` with a short comment explaining why.

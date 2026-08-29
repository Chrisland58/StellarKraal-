# Staging deployment guide

This guide describes how StellarKraal’s **staging** environment is deployed using the repository’s GitHub Actions workflow and Docker Compose overrides. For high-level staging URLs and secrets, see also the [README](../../README.md#staging-environment) and [STAGING.md](../../STAGING.md).

## Overview

- **Trigger:** merges (pushes) to the `main` branch run the [Deploy to Staging](../../.github/workflows/deploy-staging.yml) workflow.
- **Runtime:** Docker Compose with `docker-compose.yml` plus `docker-compose.staging.yml` (Stellar **testnet**, staging contract ID, staging URLs).
- **Network:** Soroban testnet RPC (default `https://soroban-testnet.stellar.org` if `STAGING_RPC_URL` is unset locally).

Example URLs used in documentation (replace with your deployed hosts):

| Service | Example URL |
|---------|-------------|
| Frontend | `https://staging.stellarkraal.example.com` |
| Backend API | `https://api-staging.stellarkraal.example.com` |

## Prerequisites

### Repository access

- Permission to merge to `main` (or to run/re-run the **Deploy to Staging** workflow on `main`).
- Access to the GitHub **staging** environment and its secrets (Settings → Environments → staging).

### Runner / host (CI)

The deploy job runs on `ubuntu-latest` and requires:

- **Docker** and **Docker Compose** (used to run `docker compose ... up -d --build`).
- **Node.js 20** (used in the preceding lint/test job).

### Local staging stack (optional)

To mirror staging on a developer machine:

- Docker & Docker Compose
- `.env` at the repo root (from `env.example`)
- Staging variables exported or set in `.env`: `STAGING_RPC_URL`, `STAGING_CONTRACT_ID`, `STAGING_API_URL`, `STAGING_FRONTEND_URL`, `JWT_SECRET`

See [Docker Compose guide](../guides/docker.md#compose-file-variants) for the exact compose command.

## Required GitHub Secrets

Configure these under **Settings → Environments → staging** (and ensure `SLACK_WEBHOOK_URL` is available for notifications):

| Secret | Used by deploy job | Purpose |
|--------|-------------------|---------|
| `STAGING_RPC_URL` | `docker compose` env | Soroban testnet JSON-RPC URL for the backend (`RPC_URL`) |
| `STAGING_CONTRACT_ID` | `docker compose` env | Staging Soroban contract ID (`CONTRACT_ID`) |
| `STAGING_API_URL` | `docker compose` env | Public backend URL (`NEXT_PUBLIC_API_URL` for frontend build/runtime) |
| `STAGING_FRONTEND_URL` | `docker compose` env | Frontend origin for backend CORS (`FRONTEND_URL`) |
| `JWT_SECRET` | `docker compose` env | JWT signing key for staging backend |
| `SLACK_WEBHOOK_URL` | Slack notify job | Incoming webhook for deployment success/failure messages |

`docker-compose.staging.yml` documents the same staging secret names in its header comment.

## Deployment process

The [Deploy to Staging](../../.github/workflows/deploy-staging.yml) workflow has three jobs:

### 1. Lint and Test (`test`)

Runs on every qualifying push to `main`:

1. Checkout repository.
2. **Frontend:** `npm ci`, `npm run lint`, `npm test -- --watchAll=false`.
3. **Backend:** `npm ci`, `npm run lint`, `npm test -- --watchAll=false`.

The deploy job does **not** start unless this job succeeds.

### 2. Deploy to Staging (`deploy-staging`)

- **Environment:** GitHub `staging` (environment protection rules apply if configured).
- **Command:**

  ```bash
  docker compose \
    -f docker-compose.yml \
    -f docker-compose.staging.yml \
    up -d --build
  ```

- **Environment variables** passed from secrets: `STAGING_RPC_URL`, `STAGING_CONTRACT_ID`, `STAGING_API_URL`, `STAGING_FRONTEND_URL`, `JWT_SECRET`.

`docker-compose.staging.yml` sets `NODE_ENV=staging`, testnet `NEXT_PUBLIC_NETWORK`, log rotation (`max-size: 10m`, `max-file: 3`), and wires backend/frontend env as shown in that file.

### 3. Slack Notification (`notify`)

- Runs `if: always()` after deploy.
- Posts **Staging Deployment Status** (success/failure) to Slack via `SLACK_WEBHOOK_URL`, with a link to the workflow run.

## Triggering deployments

| Method | Behavior |
|--------|----------|
| **Merge to `main`** | Automatically runs the full workflow (test → deploy → notify). |
| **Re-run workflow** | In GitHub Actions, open a previous **Deploy to Staging** run → **Re-run all jobs** (same commit). |
| **Deploy a specific commit** | Use **Run workflow** if enabled, or push/merge that commit to `main`; alternatively deploy manually (below). |

### Manual deploy (same as CI)

On a host with Docker and the repo checked out at the desired commit:

```bash
export STAGING_RPC_URL="..."
export STAGING_CONTRACT_ID="..."
export STAGING_API_URL="..."
export STAGING_FRONTEND_URL="..."
export JWT_SECRET="..."

docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

## Monitoring deployment progress

1. **GitHub Actions:** Repository → Actions → **Deploy to Staging** → select the run. Confirm `Lint and Test` then `Deploy to Staging` are green.
2. **Slack:** Check the channel configured for `SLACK_WEBHOOK_URL` for the deployment status attachment.
3. **Containers (on the deploy host):**

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.staging.yml ps
   docker compose -f docker-compose.yml -f docker-compose.staging.yml logs -f backend frontend
   ```

4. **Health checks:** Base `docker-compose.yml` defines health checks for backend (`GET /api/health`) and frontend (`GET /` on port 3000); frontend waits until backend is healthy.

## Rollback procedure

The staging workflow does not define an automatic rollback job. Use one of the following:

### Option A: Re-deploy a known-good commit (preferred)

1. Identify the last successful **Deploy to Staging** run on GitHub Actions.
2. **Re-run all jobs** on that workflow run, **or** check out that commit on the staging host and run the [manual deploy](#manual-deploy-same-as-ci) command again.

### Option B: Compose rollback on the host

1. Check out the previous stable Git commit on the server.
2. Rebuild and recreate containers:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
   ```

3. Verify [post-deployment validation](#post-deployment-validation).

For broader rollback patterns (CI re-run vs manual Docker), see [deployment rollback runbook](../runbooks/deployment-rollback.md).

## Post-deployment validation

### API health

```bash
curl -sS "${STAGING_API_URL}/api/health" | jq .
# or versioned:
curl -sS "${STAGING_API_URL}/api/v1/health" | jq .
```

Expect `status: "healthy"` when RPC is reachable (or `degraded` with details if RPC is down).

### Contract and RPC (optional)

From the repo root, run the verification script with staging contract settings:

```bash
RPC_URL="$STAGING_RPC_URL" \
CONTRACT_ID="$STAGING_CONTRACT_ID" \
ADMIN_ADDRESS="<your_staging_admin_public_key>" \
NEXT_PUBLIC_NETWORK=testnet \
npm run verify:deployment
```

The script (`scripts/verify-deployment.ts`) checks configuration, RPC health, and basic contract simulations; it exits with code `1` on failure.

### Frontend smoke test

1. Open `STAGING_FRONTEND_URL` in a browser.
2. Confirm the app loads and API calls target `STAGING_API_URL` (network tab / configured `NEXT_PUBLIC_API_URL`).
3. Exercise a read-only path (for example health or loan list) before testing wallet flows.

## Testing the staging environment

- **Automated:** The deploy workflow already runs frontend and backend unit tests before deploy; backend integration tests run on `main` via [Backend Integration Tests](../../.github/workflows/integration-tests.yml) (separate workflow, testnet `RPC_URL`).
- **Manual QA:** Use testnet wallets (Freighter) against the staging contract ID; do not use production keys or mainnet assets.
- **Logs:** Use [container logs runbook](../runbooks/container-logs.md) patterns with the staging compose files.
- **Troubleshooting:** [docs/troubleshooting.md](../troubleshooting.md) for CORS, JWT, RPC, and migration issues.

## Related documentation

- [STAGING.md](../../STAGING.md) — additional staging notes (verify against this guide for CI behavior).
- [README staging section](../../README.md#staging-environment)
- [Secrets rotation](../security/secrets-rotation.md)
- [Docker Compose variants](../guides/docker.md#compose-file-variants)

# Secrets Rotation Procedure

All production secrets are stored as GitHub Actions repository secrets and injected into workflows at runtime. No secret value is ever committed to the repository or printed in workflow logs.

## Required GitHub Secrets

| Secret Name | Description | Used In |
|---|---|---|
| `JWT_SECRET` | JWT signing key (min 32 chars) | backend-ci, deploy |
| `CONTRACT_ID` | Deployed Soroban contract ID | frontend-ci, deploy |
| `RPC_URL` | Soroban JSON-RPC endpoint | frontend-ci, deploy |
| `NEXT_PUBLIC_NETWORK` | Stellar network (`testnet`/`mainnet`) | frontend-ci, deploy |
| `NEXT_PUBLIC_API_URL` | Frontend → backend base URL | frontend-ci, deploy |
| `WEBHOOK_SECRET` | HMAC secret for webhook validation | deploy |
| `ADMIN_API_KEY` | Admin endpoint API key | deploy |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for alerts | deploy, deploy-staging |
| `PAGERDUTY_ROUTING_KEY` | PagerDuty Events API v2 routing key | deploy |
| `AWS_ACCESS_KEY_ID` | AWS credentials for Terraform | terraform, deploy-staging |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for Terraform | terraform, deploy-staging |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI GitHub App token | frontend-ci |

Staging-specific secrets use the same names but are scoped to the `staging` environment in GitHub (Settings → Environments → staging).

## Rotation Schedule

| Secret | Rotation Frequency |
|---|---|
| `JWT_SECRET` | Every 90 days or immediately after suspected compromise |
| `WEBHOOK_SECRET` | Every 90 days |
| `ADMIN_API_KEY` | Every 90 days |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Every 90 days |
| `SLACK_WEBHOOK_URL` | On team member offboarding |
| `PAGERDUTY_ROUTING_KEY` | On team member offboarding |
| `CONTRACT_ID` / `RPC_URL` | On contract redeployment |

## Rotation Steps

### 1. Generate a new secret value

```bash
# For random secrets (JWT_SECRET, WEBHOOK_SECRET, ADMIN_API_KEY):
openssl rand -base64 48
```

### 2. Update the GitHub secret

1. Go to **Settings → Secrets and variables → Actions** in the repository.
2. Click the secret name → **Update**.
3. Paste the new value and save.
4. For staging secrets, repeat under **Settings → Environments → staging**.

### 3. Deploy to pick up the new value

Trigger a new workflow run (push a commit or use **Actions → Re-run**). The new secret is injected automatically — no code change is needed.

### 4. Revoke the old value

- **JWT_SECRET**: After rotating, existing JWTs signed with the old key will be invalid. Users will need to log in again. Coordinate with the team before rotating in production.
- **AWS keys**: Deactivate the old IAM access key in the AWS console after confirming the new key works.
- **WEBHOOK_SECRET**: Update the secret on the webhook provider side (e.g., GitHub webhook settings) to match the new value before the old one is revoked.

### 5. Verify

Run the relevant CI workflow and confirm it passes. Check that no secret values appear in the workflow logs — GitHub automatically masks registered secrets, but verify manually if in doubt.

## Per-Secret Rotation Instructions

### JWT_SECRET
1. Generate a new value: `openssl rand -base64 48`.
2. Update the `JWT_SECRET` GitHub secret (see step 2 above) for `production` and, separately, the `staging` environment.
3. Deploy so the new value is picked up.
4. All existing JWTs become invalid — users must log in again. Announce the maintenance window before rotating in production.

### CONTRACT_ID / RPC_URL
1. Deploy or redeploy the Soroban contract to the target network.
2. Update `CONTRACT_ID` (and `RPC_URL` if the RPC endpoint changed) in the GitHub secrets for the affected environment.
3. Update the corresponding local `.env` values (`STELLAR_RPC_URL`, contract id) for anyone running the app locally, per `.env.example`.
4. Redeploy frontend/backend so they read the new contract id.

### NEXT_PUBLIC_NETWORK / NEXT_PUBLIC_API_URL
1. Update the GitHub secret value.
2. Re-run the `frontend-ci` and `deploy` workflows so the build picks up the new public env values (these are baked in at build time, so a redeploy is required, not just a runtime restart).

### WEBHOOK_SECRET
1. Generate a new value: `openssl rand -base64 48`.
2. Update the `WEBHOOK_SECRET` GitHub secret.
3. Update the matching secret on the webhook provider side (e.g., GitHub webhook settings) **before** deploying, so both sides agree during the cutover.
4. Deploy, then send a test webhook event to confirm HMAC validation succeeds.

### ADMIN_API_KEY
1. Generate a new value: `openssl rand -base64 48`.
2. Update the `ADMIN_API_KEY` GitHub secret.
3. Deploy.
4. Distribute the new key to authorized admins via a secure channel (not Slack/email in plaintext).
5. Confirm the old key no longer authenticates against the admin endpoints.

### SLACK_WEBHOOK_URL
1. In Slack, regenerate/create a new incoming webhook URL for the alerts channel.
2. Update the `SLACK_WEBHOOK_URL` GitHub secret.
3. Delete the old webhook in Slack's app configuration.
4. Trigger a test alert to confirm delivery.

### PAGERDUTY_ROUTING_KEY
1. In PagerDuty, generate a new Events API v2 integration key on the relevant service.
2. Update the `PAGERDUTY_ROUTING_KEY` GitHub secret.
3. Remove the old integration key from the PagerDuty service.
4. Trigger a low-priority test event to confirm routing.

### AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
1. In the AWS IAM console, create a new access key for the same IAM user/role.
2. Update both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` GitHub secrets together (they must match).
3. Run `terraform plan` in CI to confirm the new credentials authenticate correctly.
4. Deactivate (not delete) the old access key in IAM, then delete it after confirming no failures for 24 hours.

### LHCI_GITHUB_APP_TOKEN
1. Regenerate the token from the Lighthouse CI GitHub App installation settings.
2. Update the `LHCI_GITHUB_APP_TOKEN` GitHub secret.
3. Re-run `frontend-ci` to confirm Lighthouse CI reporting still works.

## Emergency Rotation (Suspected Compromise)

1. Immediately rotate the compromised secret following steps 1–3 above.
2. Revoke the old value at the source (AWS console, Slack, PagerDuty, etc.).
3. Review recent workflow logs for any accidental exposure.
4. File an internal incident report in `#security`.
5. If a JWT secret was compromised, invalidate all active sessions by rotating the secret and notifying users.

## Verifying No Secrets in Logs

GitHub automatically redacts registered secret values from logs. To verify:

1. Open a completed workflow run in GitHub Actions.
2. Search the logs for any known secret substring — it should appear as `***`.
3. If a secret appears in plain text, rotate it immediately and investigate how it was exposed (e.g., `echo $SECRET` in a run step).

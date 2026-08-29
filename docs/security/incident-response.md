# Security Incident Response Procedure

This document defines the runbook for responding to security incidents affecting the
StellarKraal platform. It covers the three most likely incident classes:

1. Compromised JWT secret
2. Soroban smart-contract exploit
3. Database breach / unauthorized data access

All steps assume the responder has admin access to the GitHub repository, AWS console,
and the staging/production environments.

---

## General Principles

- **Contain first, investigate second.** Stop the bleeding before collecting evidence.
- **Preserve evidence.** Do not modify logs, rotate secrets, or redeploy before taking
  forensic snapshots where possible.
- **Communicate early.** Notify the security lead and relevant stakeholders within the
  acknowledgement window defined in `SECURITY.md`.
- **Never hardcode secrets.** All credentials are injected via environment variables or
  GitHub Secrets. See `docs/security/secrets-rotation.md` for rotation mechanics.

---

## Incident Classification

| Class | Severity | Typical Blast Radius |
|-------|----------|----------------------|
| Compromised JWT secret | High | All authenticated API sessions |
| Contract exploit | Critical | User funds, protocol solvency |
| Database breach | High | PII, loan/collateral records, audit logs |

---

## 1. Compromised JWT Secret

### Detection

- Unexpected admin-route access from an unknown IP or user-agent.
- Spike in `401 Unauthorized` responses followed by successful authenticated requests.
- GitHub Secret Scanning alert on `JWT_SECRET` (push protection or Dependabot).
- User reports of session hijacking or unauthorized loan actions.

### Containment

1. **Rotate `JWT_SECRET` immediately** in GitHub Secrets (Settings → Secrets and variables → Actions).
   Rotate for both `production` and `staging` environments.
2. **Deploy the rotated secret** by triggering a backend redeploy.
   Existing JWTs signed with the old key will fail validation, forcing re-authentication.
3. **Invalidate active sessions** by clearing any server-side session allowlist or token cache.
4. **Enable elevated logging** on the auth middleware to capture the source of forged tokens.

### Eradication

1. Review CloudTrail / GitHub Actions logs for the time window of compromise to identify
   the attacker's actions (loan modifications, data exports, admin calls).
2. Check for backdoors: new GitHub users, webhooks, or SSH keys added during the window.
3. Verify the new `JWT_SECRET` has not leaked in any deployment logs or error traces.
4. If the compromise originated from a leaked `.env` file, audit all services that read
   that file and rotate every secret it contained.

### Recovery

1. Notify affected users that they must log in again.
2. Restore normal logging verbosity once the investigation is complete.
3. Document the root cause and add a prevention measure (e.g., shorter secret rotation
   cadence, IP allowlisting for admin routes).

### Notification Checklist

- [ ] Internal `#security` Slack channel
- [ ] Project maintainers
- [ ] Affected users (via in-app banner or email if PII was accessed)
- [ ] Regulators if personal data was exfiltrated (per local data-protection law)

---

## 2. Soroban Smart-Contract Exploit

### Detection

- On-chain health-factor or balance anomalies reported by oracles or monitors.
- Unexpected contract call failures or state transitions in Grafana/Prometheus alerts.
- Community reports of unauthorized liquidations, fund drainage, or loan state corruption.
- Contract upgrade or pause triggers firing without admin action.

### Containment

1. **Pause the contract** using the admin `pause` function if the admin key is still secure.
   This blocks new loans, liquidations, and oracle submissions while allowing repayments.
2. **Disable frontend actions** that interact with the contract by setting a feature flag
   or rolling back the frontend to a safe version.
3. **Freeze related backend endpoints** (`POST /api/v1/loans`, `PUT /api/loans/:id/repay`)
   if they are amplifying the exploit.

### Eradication

1. Capture the on-chain transaction hash(s) of the exploit and the contract ledger sequence.
2. Query the contract state via `get_loan`, `get_collateral`, and any relevant `DataKey`
   entries to quantify the damage.
3. Identify the exploit vector (reentrancy, integer overflow, access-control bypass, etc.)
   and patch the Rust source.
4. Build and audit the patched WASM locally: `stellar contract build`.
5. Propose an upgrade via `propose_upgrade` and schedule execution after the
   `UPGRADE_TIMELOCK_SECS` (24 h) window.

### Recovery

1. Execute the upgrade once the timelock expires.
2. Run `migrate_storage` if the patch requires a storage layout change.
3. Verify contract state consistency (loan counters, collateral ownership, balances).
4. Unpause the contract and re-enable frontend interactions.
5. Reimburse affected users from the treasury if funds were lost.

### Notification Checklist

- [ ] Internal `#security` and `#engineering` Slack channels
- [ ] Stellar network explorer / community channels (if testnet/mainnet impact)
- [ ] Affected borrowers and liquidators
- [ ] External auditors (if the exploit class was previously audited as mitigated)
- [ ] Regulators if user funds were lost

---

## 3. Database Breach / Unauthorized Data Access

### Detection

- Unusual database query volume or new table access patterns in CloudWatch / RDS logs.
- Unrecognized IP addresses accessing the backend API or direct DB connection.
- GitHub Dependabot or Trivy alert on a SQLite/PostgreSQL privilege-escalation CVE.
- User reports of personal data exposure (wallet addresses, loan amounts, animal records).

### Containment

1. **Rotate all database credentials** (`DATABASE_URL`, any IAM database auth tokens).
2. **Revoke compromised IAM principals** or API keys that provided DB access.
3. **Block the offending IP** at the WAF / security-group level.
4. **Enable audit-logging mode** on the database if not already active.

### Eradication

1. Take a forensic snapshot of the database before applying patches (do not modify in-place).
2. Review `AUDIT_LOG_DIR` for unauthorized reads/writes during the exposure window.
3. Patch the vulnerability (upgrade SQLite/PostgreSQL, fix SQL injection, close open S3 bucket, etc.).
4. Rotate every secret that may have been stored in the database or derived from it
   (JWT_SECRET, WEBHOOK_SECRET, admin API keys).
5. Verify no backdoor accounts or triggers were inserted.

### Recovery

1. Restore the database from the last known-good backup if data integrity is in doubt.
2. Replay legitimate transactions from the audit log after the restore point.
3. Notify users whose PII was accessed and offer remediation guidance.
4. Add compensating controls (row-level security, network isolation, least-privilege IAM).

### Notification Checklist

- [ ] Internal `#security` and `#infrastructure` Slack channels
- [ ] Legal / compliance team
- [ ] Affected users (direct notification if PII was accessed)
- [ ] Regulators if personal data was exfiltrated (per local data-protection law)
- [ ] External security auditors for root-cause analysis

---

## Escalation Matrix

| Incident Type | First Responder | Escalation Path |
|---------------|-----------------|-----------------|
| JWT secret compromise | On-call backend engineer | Security lead → Engineering manager |
| Contract exploit | Smart-contract engineer | Security lead → Protocol lead |
| Database breach | DevOps / SRE | Security lead → CTO |

---

## Post-Incident Review

After every incident:

1. File a post-mortem within 5 business days.
2. Update this runbook with any new detection signals or containment steps.
3. Add monitoring or alerting rules that would have reduced detection time.
4. Schedule a follow-up review to verify remediation measures are in place.

# Disaster Recovery Playbook

## Overview

This playbook provides end-to-end recovery procedures for catastrophic failure scenarios in the StellarKraal production environment. It covers total infrastructure loss, database corruption, smart contract exploits, and other disaster scenarios.

Use this document when multiple systems have failed simultaneously or when a single failure requires coordinated recovery across infrastructure, application, and blockchain layers.

**Target Audience**: SRE, Platform Engineers, Engineering Manager, Protocol Team  
**Last Updated**: 2026-07-27  
**Review Cycle**: Quarterly

---

## Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

| Scenario | RTO | RPO | Notes |
|---|---|---|---|
| **Total infrastructure loss** | 4 hours | 24 hours | Restore from daily backups; Stellar state is authoritative |
| **Database corruption** | 1 hour | 1 hour | Restore from hourly snapshots |
| **Smart contract exploit** | 8 hours | 0 (blockchain) | Pause contract, deploy patched version, migrate state |
| **RPC provider outage** | 15 minutes | 0 | Failover to secondary RPC provider |
| **Credential compromise** | 30 minutes | 0 | Rotate secrets, revoke tokens, audit access logs |

---

## Scenario 1: Total Infrastructure Loss

### Trigger Conditions
- AWS region outage affecting all production resources
- Accidental deletion of Terraform state or production resources
- Catastrophic data center failure

### Impact
- Complete service outage (frontend, backend, database)
- Loss of off-chain state (user profiles, cached appraisals, audit logs)
- On-chain state (loans, collateral) remains intact on Stellar network

### Recovery Procedure

#### Phase 1: Assess Scope (10 minutes)

1. **Confirm the failure mode**:
   - Check AWS Status page for region-wide outages.
   - Verify Terraform state bucket is accessible.
   - Test connectivity to production VPC and EC2 instances.

2. **Declare incident**:
   ```
   Severity: P0 (Critical)
   Incident Channel: #incidents
   On-call: SRE + Engineering Manager
   ```

3. **Notify stakeholders**:
   - Post status update to status page (if hosted externally).
   - Notify users via Twitter/social media if website is unreachable.

#### Phase 2: Provision New Infrastructure (60–90 minutes)

1. **Initialize Terraform in a new AWS region or account**:
   ```bash
   cd infrastructure
   terraform init -backend-config="bucket=stellarkraal-tfstate-backup"
   terraform plan -var-file=envs/production.tfvars
   terraform apply -var-file=envs/production.tfvars
   ```

2. **Verify infrastructure components**:
   - VPC, subnets, security groups
   - EC2 instances or ECS tasks
   - RDS/database instances
   - Load balancers and DNS records

3. **Update DNS**:
   - Point `app.stellarkraal.example.com` and `api.stellarkraal.example.com` to new load balancer IPs.
   - Wait for DNS propagation (5–15 minutes).

#### Phase 3: Restore Database (30–60 minutes)

Follow the [Database Restore Procedure](./restore-procedure.md) to restore from the latest AWS Backup snapshot.

1. Identify the most recent backup (RPO: 24 hours for daily backups, 1 hour for hourly snapshots).
2. Restore to a new RDS instance in the new region.
3. Update `DATABASE_URL` in backend environment configuration.
4. Verify data integrity:
   ```sql
   SELECT COUNT(*) FROM loans;
   SELECT COUNT(*) FROM collateral;
   SELECT COUNT(*) FROM users;
   ```

#### Phase 4: Redeploy Application (30 minutes)

1. **Deploy backend**:
   ```bash
   cd backend
   docker build -t stellarkraal-backend:latest .
   docker push <ECR_URI>/stellarkraal-backend:latest
   # Trigger ECS task update or EC2 deployment via CI/CD
   ```

2. **Deploy frontend**:
   ```bash
   cd frontend
   npm run build
   # Deploy static assets to S3 + CloudFront or Vercel
   ```

3. **Update environment variables**:
   - Retrieve secrets from AWS Secrets Manager or backup key vault.
   - Ensure `RPC_URL`, `CONTRACT_ID`, `JWT_SECRET`, `WEBHOOK_SECRET`, `ADMIN_API_KEY` are correctly set.

4. **Run smoke tests**:
   ```bash
   curl https://api.stellarkraal.example.com/api/health
   # Expected: {"status":"healthy","db":"connected","rpcReachable":true}
   ```

#### Phase 5: Reconcile On-Chain vs Off-Chain State (60–120 minutes)

1. **Query Stellar blockchain for authoritative loan state**:
   ```bash
   stellar contract invoke \
     --id $CONTRACT_ID \
     --network mainnet \
     -- list_all_loans
   ```

2. **Compare with restored database**:
   - Identify discrepancies (loans closed on-chain but marked as active off-chain, or vice versa).
   - Write a reconciliation script to update off-chain records.

3. **Replay missing transactions**:
   - If the restored database is more than a few hours old, some recent transactions may be missing.
   - Parse Stellar transaction history for the contract and backend signer accounts.
   - Update the database with missing loan/collateral records.

#### Phase 6: Resume Service (15 minutes)

1. **Unpause contract** (if paused during incident):
   ```bash
   stellar contract invoke \
     --id $CONTRACT_ID \
     --network mainnet \
     --source <ADMIN_SECRET> \
     -- unpause \
     --admin <ADMIN_ADDRESS>
   ```

2. **Monitor for errors**:
   - Check Grafana dashboards for 5xx errors, RPC failures, database connection errors.
   - Watch `#incidents` Slack channel for automated alerts.

3. **Post-incident review**:
   - Schedule a blameless post-mortem within 48 hours.
   - Document lessons learned and update this playbook.

**Total RTO**: ~4 hours (depending on backup size and DNS propagation).

---

## Scenario 2: Database Corruption

### Trigger Conditions
- SQLite file corruption (`malformed database` error)
- PostgreSQL index corruption or transaction log failure
- Accidental `DROP TABLE` or mass `DELETE`

### Impact
- Backend API returns 503 errors for all database-dependent routes
- Users cannot view profiles, loan history, or collateral records
- On-chain state remains intact

### Recovery Procedure

1. **Stop the backend service** to prevent further corruption:
   ```bash
   docker-compose stop backend
   # or for production:
   systemctl stop stellarkraal-backend
   ```

2. **Verify corruption**:
   ```bash
   # For SQLite:
   sqlite3 backend/database.sqlite "PRAGMA integrity_check;"
   
   # For PostgreSQL:
   psql $DATABASE_URL -c "SELECT pg_database.datname, pg_database_size(pg_database.datname) FROM pg_database;"
   ```

3. **Restore from backup**:
   - Follow [Database Restore Procedure](./restore-procedure.md).
   - Use the most recent backup (RPO: 1 hour for production, 24 hours for staging).

4. **Run migrations** to ensure schema is up-to-date:
   ```bash
   cd backend
   npm run migrate up
   ```

5. **Reconcile on-chain state** (if the backup is older than a few minutes):
   - Query Stellar for recent transactions.
   - Update off-chain database with any missing records.

6. **Restart the backend**:
   ```bash
   docker-compose up -d backend
   ```

7. **Verify service health**:
   ```bash
   curl https://api.stellarkraal.example.com/api/health
   ```

**Total RTO**: ~1 hour.

---

## Scenario 3: Smart Contract Exploit

### Trigger Conditions
- Bug bounty report or public disclosure of a critical vulnerability
- Unexpected on-chain behavior (unauthorized liquidations, loan manipulation)
- Alert from contract monitoring: `UnauthorizedAdminChange`, `AnomalousContractBehavior`

### Impact
- **Critical**: User funds at risk, protocol integrity compromised
- **Immediate action required**: Pause contract, assess damage, deploy fix

### Recovery Procedure

#### Phase 1: Containment (5 minutes)

1. **Pause the contract immediately**:
   ```bash
   stellar contract invoke \
     --id $CONTRACT_ID \
     --network mainnet \
     --source <ADMIN_SECRET> \
     -- pause \
     --admin <ADMIN_ADDRESS>
   ```

2. **Post emergency alert**:
   - Notify all channels: `#incidents`, Twitter, status page.
   - Message: "The StellarKraal protocol has been paused while we investigate a potential security issue. User funds are safe. All loans and collateral are frozen until further notice."

3. **Convene incident response team**:
   - Protocol Lead
   - Smart Contract Engineer
   - Security Auditor (if available)
   - Engineering Manager

#### Phase 2: Assessment (30–60 minutes)

1. **Analyze the exploit**:
   - Review the vulnerability report or transaction logs.
   - Identify the attack vector (e.g., reentrancy, integer overflow, access control bypass).
   - Determine which functions are affected and which user actions are at risk.

2. **Quantify the damage**:
   - Query Stellar to list all loans and collateral records.
   - Identify any unauthorized state changes:
     ```bash
     stellar contract invoke \
       --id $CONTRACT_ID \
       --network mainnet \
       -- list_all_loans
     ```
   - Calculate total value at risk and any losses already incurred.

3. **Classify severity**:
   - **Critical**: Funds can be stolen or locked permanently → deploy emergency fix ASAP.
   - **High**: State manipulation possible but no immediate fund loss → deploy fix within 24 hours.
   - **Medium**: Denial-of-service or minor logic bug → deploy fix in next release.

#### Phase 3: Patch and Test (2–4 hours)

1. **Develop a fix**:
   - Update the contract code in `contracts/stellarkraal/src/lib.rs`.
   - Add regression tests to cover the exploit.
   - Run full test suite:
     ```bash
     cd contracts/stellarkraal
     cargo test
     cargo test --release
     ```

2. **Audit the fix**:
   - Conduct a focused code review with the security auditor.
   - If possible, engage a third-party auditor for critical fixes.

3. **Test on Stellar testnet**:
   - Deploy the patched contract to testnet.
   - Simulate the exploit to confirm it's blocked.
   - Verify all normal operations still work.

#### Phase 4: Deployment (1 hour)

1. **Deploy the patched contract to mainnet**:
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/stellarkraal.wasm \
     --network mainnet \
     --source <DEPLOYER_SECRET>
   ```

2. **Migrate state** (if necessary):
   - If the new contract has a different storage schema, write a migration script.
   - Alternatively, use the old contract's admin functions to export state and import it into the new contract.

3. **Update backend configuration**:
   - Set `CONTRACT_ID` to the new contract address.
   - Redeploy backend services to pick up the new contract ID.

#### Phase 5: Resume Operations (30 minutes)

1. **Unpause the new contract**:
   ```bash
   stellar contract invoke \
     --id $NEW_CONTRACT_ID \
     --network mainnet \
     --source <ADMIN_SECRET> \
     -- unpause \
     --admin <ADMIN_ADDRESS>
   ```

2. **Post public update**:
   - Explain the issue, the fix, and any user impact.
   - Example: "The vulnerability has been patched and the protocol has resumed operations. All user funds are safe. Full details will be published in our post-mortem."

3. **Monitor closely**:
   - Watch for any anomalous behavior in the first 24 hours.
   - Set up enhanced alerting for contract errors and unusual transaction patterns.

**Total RTO**: ~8 hours (depending on fix complexity).

---

## Scenario 4: RPC Provider Outage

### Trigger Conditions
- Soroban RPC endpoint is unreachable or returning 5xx errors
- Alert: `RPCConnectionFailure`, `HighRPCErrorRate`

### Impact
- Backend cannot submit transactions or query blockchain state
- User operations (loan requests, repayments) fail with 502 errors
- Read-only queries may still work if cached

### Recovery Procedure

1. **Verify RPC status**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
     $RPC_URL
   ```

2. **Failover to secondary RPC**:
   - Update `RPC_URL` in backend environment configuration to a fallback provider (e.g., `https://rpc.stellar.org` or a private node).
   - Restart backend service to pick up the new RPC URL.

3. **Verify service health**:
   ```bash
   curl https://api.stellarkraal.example.com/api/health
   # Expected: {"status":"healthy","rpcReachable":true}
   ```

**Total RTO**: ~15 minutes.

**See also**: [RPC Failure Runbook](../runbooks/rpc-failure.md)

---

## Scenario 5: Credential Compromise

### Trigger Conditions
- AWS access keys leaked in public repository
- `JWT_SECRET` or `ADMIN_API_KEY` exposed
- Unauthorized admin actions detected in contract logs

### Impact
- Unauthorized access to backend API, admin endpoints, or smart contract admin functions
- Potential data breach or unauthorized fund transfers

### Recovery Procedure

#### Phase 1: Revoke Compromised Credentials (5 minutes)

1. **AWS credentials**:
   ```bash
   aws iam delete-access-key --access-key-id <COMPROMISED_KEY>
   aws iam create-access-key --user-name stellarkraal-backend
   ```

2. **JWT_SECRET**:
   - Generate a new secret:
     ```bash
     openssl rand -hex 32
     ```
   - Update `JWT_SECRET` in AWS Secrets Manager or `.env`.
   - Redeploy backend (all existing user sessions will be invalidated).

3. **ADMIN_API_KEY**:
   - Generate a new key:
     ```bash
     openssl rand -hex 16
     ```
   - Update `ADMIN_API_KEY` in environment configuration.
   - Redeploy backend.

4. **Smart contract admin key**:
   - If the admin Stellar secret key is compromised, initiate an admin transfer:
     ```bash
     stellar contract invoke \
       --id $CONTRACT_ID \
       --network mainnet \
       --source <OLD_ADMIN_SECRET> \
       -- propose_new_admin \
       --admin <OLD_ADMIN_ADDRESS> \
       --new_admin <NEW_ADMIN_ADDRESS>
     
     stellar contract invoke \
       --id $CONTRACT_ID \
       --network mainnet \
       --source <NEW_ADMIN_SECRET> \
       -- accept_admin_role \
       --new_admin <NEW_ADMIN_ADDRESS>
     ```

#### Phase 2: Audit Access Logs (15 minutes)

1. **Check for unauthorized activity**:
   - Query AWS CloudTrail for API calls made with the compromised credentials.
   - Search backend audit logs (`AUDIT_LOG_DIR`) for unauthorized admin actions.
   - Query Stellar transaction history for the admin account:
     ```bash
     stellar account <ADMIN_ADDRESS> --network mainnet
     ```

2. **Identify impact**:
   - Were any funds transferred?
   - Were any protocol parameters changed (LTV, liquidation threshold)?
   - Were any users' data accessed or modified?

#### Phase 3: Notify Stakeholders (10 minutes)

1. **Internal**:
   - Post summary in `#incidents`.
   - Notify Engineering Manager and Security Officer.

2. **External** (if user data was accessed):
   - Draft a breach notification per GDPR/CCPA requirements.
   - Notify affected users within 72 hours.

**Total RTO**: ~30 minutes.

---

## Cross-Scenario Recovery Checklist

Use this checklist for **any** disaster recovery scenario:

- [ ] Incident declared with severity level (P0/P1/P2)
- [ ] On-call SRE and Engineering Manager notified
- [ ] Status page updated with current status and ETA
- [ ] Backup validity confirmed (last successful backup timestamp)
- [ ] New infrastructure provisioned (if needed)
- [ ] Database restored from backup
- [ ] Application services redeployed
- [ ] Environment variables and secrets verified
- [ ] On-chain vs off-chain state reconciled
- [ ] Smoke tests passed (health check, sample API calls)
- [ ] Service resumed and monitoring active
- [ ] Post-incident review scheduled
- [ ] Playbook updated with lessons learned

---

## Related Runbooks

| Runbook | Scenario |
|---|---|
| [Database Restore Procedure](./restore-procedure.md) | Single database failure or corruption |
| [RPC Node Unreachable](../runbooks/rpc-failure.md) | Soroban RPC connectivity issues |
| [Contract Invocation Failure](../runbooks/contract-invocation-failure.md) | Smart contract error codes and diagnosis |
| [Deployment Rollback](../runbooks/deployment-rollback.md) | Bad deployment causing production issues |
| [Liquidation Failure](../runbooks/liquidation-failure.md) | Liquidation job or health factor issues |

---

## Quarterly Validation

To ensure this playbook remains accurate and the team is prepared:

- [ ] **Test infrastructure provisioning**: Run a Terraform plan in a sandbox account.
- [ ] **Test database restore**: Restore the previous day's backup to a test instance and verify data integrity.
- [ ] **Test RPC failover**: Manually switch to a secondary RPC provider and verify backend connectivity.
- [ ] **Test contract pause/unpause**: On testnet, pause and unpause the contract.
- [ ] **Review and update RTO/RPO targets**: Confirm targets are still achievable with current infrastructure.
- [ ] **Review team contact list**: Ensure on-call rotation and escalation paths are up-to-date.

**Last Validated By**: ____________________  
**Date**: ____________________

---

## Appendix: Emergency Contacts

| Role | Primary | Backup | Escalation |
|---|---|---|---|
| **On-call SRE** | PagerDuty rotation | — | Engineering Manager |
| **Protocol Lead** | @protocol-lead (Slack) | @protocol-backup | CTO |
| **Security Officer** | security@stellarkraal.example.com | — | Legal/Compliance |
| **Engineering Manager** | @eng-manager (Slack) | — | VP Engineering |

**Status Page**: https://status.stellarkraal.example.com  
**Incident Channel**: #incidents (Slack)  
**PagerDuty Service**: StellarKraal Production

# Runbook: Contract Invocation Failure

## Incident Description
Soroban smart contract calls from the backend are failing, causing operations like loan origination, repayment, and liquidation to return errors. This can be caused by contract errors, incorrect parameters, contract pause state, or RPC node issues.

## Detection Steps
- **Alerts**: Alerts firing for `ContractInvocationFailure`, `HighContractErrorRate`, or `BackendHigh5xxRate`.
- **Grafana Dashboards**: Check the `StellarKraal RPC Metrics` dashboard. Look for spikes in contract error rates or 502 responses from the backend.
- **Logs**: Search for `Contract error:`, `ContractError`, or specific error codes (e.g., `#3 Unauthorized`) in the backend logs.

## Impact Assessment
- **Criticality**: High to Critical (depending on which operations are affected)
- **User Impact**: Users cannot originate loans, make repayments, or perform any on-chain operations. Read-only queries may still work if the RPC is reachable.

## Contract Error Codes

The StellarKraal contract defines 19 error codes. Each code requires specific diagnosis and remediation steps.

### Error #1: Not Initialized

**Message**: `Contract is not initialized`

**Cause**: The contract was deployed but `initialize()` has never been called.

**Diagnosis**:
```bash
# Query contract state to check if admin is set
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- is_paused
```
If this fails with error #1, the contract is not initialized.

**Remediation**:
1. Call `initialize()` with valid parameters (admin, oracle, token, treasury, LTV, liquidation threshold).
2. This is a one-time operation and can only be performed by the deployer.
3. If the contract is already in use, this indicates a deployment issue — escalate immediately.

---

### Error #2: Already Initialized

**Message**: `Contract is already initialized`

**Cause**: `initialize()` was called more than once.

**Diagnosis**: Check deployment logs to confirm initialization was already completed.

**Remediation**: No action needed. This error should never occur in production runtime — it indicates a deployment script issue. Ensure deploy scripts check initialization state before calling `initialize()`.

---

### Error #3: Unauthorized

**Message**: `Unauthorized: caller does not have the required permissions`

**Cause**: The caller address does not match the expected owner/admin address for the operation (e.g., calling admin-only functions like `pause()`, `set_liquidation_threshold()`).

**Diagnosis**:
```bash
# Check which account the backend is using
echo $BACKEND_SIGNER_SECRET | stellar keys show

# Compare with contract admin
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_admin
```

**Remediation**:
1. For user operations (loan requests, repayments): Verify the signed transaction includes the correct user signature.
2. For admin operations: Ensure the backend is using the correct admin signing key.
3. If the admin key has been rotated, update `BACKEND_SIGNER_SECRET` or equivalent secret in the deployment environment.

---

### Error #4: Insufficient Collateral

**Message**: `Insufficient collateral: loan amount exceeds the maximum allowed by the LTV ratio`

**Cause**: The requested loan amount is greater than `(total_collateral_value × LTV_BPS) / 10000`.

**Diagnosis**:
```bash
# Check current LTV ratio
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_ltv

# Check collateral appraisal value
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_collateral \
  --collateral_id <ID>
```

**Remediation**:
1. **User-facing**: Inform the user they need to reduce their loan amount or add more collateral.
2. **If this is unexpected**: Verify collateral appraisals are recent and accurate. Check if oracle price feeds are stale or incorrect.
3. **If LTV is misconfigured**: Admin can update the LTV with `set_ltv(admin, new_ltv_bps)`.

---

### Error #5: Loan Not Found

**Message**: `Loan not found`

**Cause**: The provided loan ID does not exist in contract storage.

**Diagnosis**: Check if the loan ID exists in the off-chain database (`backend/dev.sqlite3` or production DB).

**Remediation**:
1. **Off-chain/on-chain sync issue**: If the loan exists off-chain but not on-chain, investigate the original `request_loan()` transaction. It may have failed silently.
2. **User error**: User provided an incorrect loan ID. Return a 404 to the client.

---

### Error #6: Collateral Not Found

**Message**: `Collateral not found`

**Cause**: The provided collateral ID does not exist, or the `collateral_ids` array is empty.

**Diagnosis**: Query the contract to list registered collateral for the user:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- list_collateral \
  --owner <USER_ADDRESS>
```

**Remediation**:
1. **User error**: User provided an incorrect or non-existent collateral ID. Return a 404.
2. **Data sync issue**: If collateral exists off-chain but not on-chain, investigate the original `register_livestock()` call.

---

### Error #7: Health Factor is Safe

**Message**: `Health factor is safe: loan is not eligible for liquidation`

**Cause**: A liquidation attempt was made on a loan whose health factor is above the liquidation threshold.

**Diagnosis**:
```bash
# Calculate current health factor
# HF = (collateral_value × liquidation_threshold_bps) / (loan_amount × 10000)
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_loan \
  --loan_id <ID>
```

**Remediation**:
1. **Expected behavior**: The loan is healthy and should not be liquidated. No action needed.
2. **If liquidation is urgent**: Wait for collateral prices to drop or the loan to accrue more interest (if interest accrual is implemented).
3. **If health factor calculation is incorrect**: Check oracle price feeds and verify TWAP mechanism is functioning.

---

### Error #8: Invalid Amount

**Message**: `Invalid amount: value must be positive and must not cause overflow`

**Cause**: A zero, negative, or overflow-causing amount was provided (e.g., loan amount, repayment amount, appraisal value).

**Diagnosis**: Log the exact amount that triggered the error. Check for:
- Zero values (`0`)
- Values exceeding `u128::MAX`
- Negative values (should be caught by type system, but check for underflows)

**Remediation**:
1. **Input validation**: Ensure the backend validates amounts before submitting to the contract.
2. **If amounts are suspiciously large**: Investigate if there's a unit conversion issue (e.g., stroops vs XLM).

---

### Error #9: Loan Already Closed

**Message**: `Loan is already closed`

**Cause**: An operation (repay, liquidate) was attempted on a loan that has already been fully repaid or liquidated.

**Diagnosis**: Query the loan state:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_loan \
  --loan_id <ID>
```
Check the `status` field. If it shows `Closed` or `Liquidated`, the loan cannot be modified.

**Remediation**:
1. **Expected behavior**: The loan is already settled. Return a 409 Conflict to the client.
2. **Data sync issue**: Update the off-chain database to reflect the loan's closed state.

---

### Error #10: Invalid Fee Rate

**Message**: `Invalid fee rate: rate exceeds the protocol maximum of 5%`

**Cause**: An admin attempted to set an origination fee or liquidation penalty above 500 bps (5%).

**Diagnosis**: Check the value being set:
```bash
# Example: setting origination fee
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- set_origination_fee \
  --admin <ADMIN_ADDRESS> \
  --fee_bps 600  # ❌ exceeds 500 bps cap
```

**Remediation**:
1. **Reduce the fee**: Call the admin function again with a value ≤ 500 bps.
2. **If the cap is too low**: This is a protocol design decision. Raising the cap requires a contract upgrade.

---

### Error #11: Exceeds Close Factor

**Message**: `Exceeds close factor: repay amount is above the close-factor cap`

**Cause**: A repayment or liquidation exceeds the close factor limit (e.g., trying to repay 100% of a large loan in a single transaction when the close factor is set to 50%).

**Diagnosis**:
```bash
# Check current close factor
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_close_factor
```

**Remediation**:
1. **User-facing**: Inform the user to make partial repayments that respect the close factor.
2. **Admin action**: If the close factor is too restrictive, the admin can update it with `set_close_factor(admin, new_close_factor_bps)`.

---

### Error #12: Invalid Close Factor

**Message**: `Invalid close factor: value must be between 1 and 10000 bps`

**Cause**: An admin attempted to set a close factor outside the valid range.

**Diagnosis**: Check the value being set.

**Remediation**: Call `set_close_factor()` with a value between 1 and 10000 (0.01% to 100%).

---

### Error #13: Contract is Paused

**Message**: `Contract is paused — new operations are temporarily disabled`

**Cause**: The contract has been paused by the admin (e.g., during an incident or upgrade).

**Diagnosis**:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- is_paused
```

**Remediation**:
1. **Expected pause**: Wait for the admin to unpause the contract. Check incident channels for updates.
2. **Unintended pause**: Admin should call `unpause(admin)` immediately.
3. **If pause has expired but still shows as paused**: Check the `pause_expiry` ledger. If the expiry has passed, the contract should automatically allow operations again. If not, this is a contract bug — escalate to engineering.

---

### Error #14: Oracle Already Registered

**Message**: `Oracle is already registered`

**Cause**: An admin attempted to register an oracle address that is already authorized.

**Diagnosis**: List currently registered oracles:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- list_oracles
```

**Remediation**: No action needed unless the admin intended to register a different address. Verify the oracle address before retrying.

---

### Error #15: Oracle Limit Reached

**Message**: `Oracle limit reached: maximum number of oracles has been registered`

**Cause**: The contract has a hard limit on the number of oracles (e.g., 10) and that limit has been reached.

**Diagnosis**: Query the oracle count and list:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- list_oracles
```

**Remediation**:
1. **Remove an inactive oracle**: Use `remove_oracle(admin, oracle_address)` to deregister an unused oracle.
2. **If all oracles are active**: This is a protocol limit. Increasing the cap requires a contract upgrade.

---

### Error #16: Oracle Not Found

**Message**: `Oracle not found`

**Cause**: An admin attempted to remove or update an oracle that is not registered.

**Diagnosis**: Verify the oracle address:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- list_oracles
```

**Remediation**: Correct the oracle address and retry, or confirm the oracle was already removed.

---

### Error #17: Insufficient Oracle Quorum

**Message**: `Insufficient oracle quorum: not enough valid price submissions`

**Cause**: A price-dependent operation (loan origination, liquidation) could not proceed because too few oracles have submitted recent price data.

**Diagnosis**:
```bash
# Check recent oracle submissions
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_latest_price \
  --asset <ASSET_SYMBOL>
```

**Remediation**:
1. **Wait for oracle updates**: Oracles may be experiencing downtime or delays. Check oracle infrastructure and logs.
2. **Lower quorum requirement**: Admin can adjust the minimum quorum with `set_oracle_quorum(admin, new_quorum)`.
3. **Add more oracles**: If the quorum is set to a high number (e.g., 7 of 10) and many oracles are offline, register additional oracles or reduce the quorum.

---

### Error #18: Invalid Price

**Message**: `Invalid price: price value is out of bounds or otherwise invalid`

**Cause**: An oracle submitted a price that is zero, negative, or outside acceptable bounds (e.g., exceeds a sanity-check threshold).

**Diagnosis**: Check oracle submissions and contract logs for the rejected price value.

**Remediation**:
1. **Oracle issue**: Investigate the oracle that submitted the invalid price. It may have a data feed bug or misconfiguration.
2. **Contract validation too strict**: If legitimate prices are being rejected, review the contract's price validation logic and adjust bounds if necessary (requires contract upgrade).

---

### Error #19: Contract is Not Paused

**Message**: `Contract is not paused`

**Cause**: An admin attempted to call `unpause()` when the contract is already active.

**Diagnosis**:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- is_paused
```

**Remediation**: No action needed. This is expected behavior if the contract is already unpaused.

---

## General Diagnosis Steps

### 1. Verify Contract Initialization and Pause State

```bash
# Check if contract is initialized
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- is_paused

# Expected: returns true or false (not error #1)
```

If the contract is paused, all write operations will fail with error #13.

### 2. Check RPC Connectivity

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  $RPC_URL
```

If the RPC is unreachable, contract calls will fail at the transport layer before reaching the contract logic. See [RPC Failure Runbook](./rpc-failure.md).

### 3. Inspect Transaction Logs

If the backend submitted a transaction but the contract rejected it, the transaction result will contain the error code. Search backend logs for:
```
Contract error: #<NUMBER>
```

Cross-reference the number with the error code table above.

### 4. Check Sequence Numbers

Stale or duplicate transactions will fail with Stellar-level errors (not contract errors). Look for `TX_BAD_SEQ` or `tx_insufficient_fee` in RPC responses.

### 5. Verify Contract Deployment

Ensure the `CONTRACT_ID` environment variable matches the actual deployed contract:
```bash
stellar contract info \
  --id $CONTRACT_ID \
  --network testnet
```

If this returns a 404 or unexpected data, the `CONTRACT_ID` is incorrect.

---

## Escalation Path

1. **Error codes #1, #2, #3**: Likely a configuration or deployment issue. Escalate to **Platform/Infrastructure Engineer**.
2. **Error codes #4, #5, #6, #7**: User-facing errors or data sync issues. Escalate to **Backend Engineer** to investigate off-chain database state.
3. **Error codes #13, #14, #15, #16, #17, #18, #19**: Admin or oracle issues. Escalate to **Protocol/Smart Contract Team**.
4. **If the contract is returning errors that don't match any of the 19 codes**: Escalate to **Smart Contract Team** immediately — this may indicate a contract bug or an unknown error state.

If the incident persists for more than 15 minutes or affects critical operations (liquidations, repayments), notify:
- `#incidents` Slack channel
- **Engineering Manager**
- **On-call SRE** via PagerDuty

---

## Related Runbooks

- [RPC Node Unreachable](./rpc-failure.md)
- [Database Connection Failure](./db-failure.md)
- [Liquidation Failure](./liquidation-failure.md)

## Related Documentation

- [Smart Contract Interface](../contracts/stellarkraal-interface.md) — Full contract API reference
- [API Error Code Reference](../api-error-codes.md) — HTTP error codes and contract error mappings
- [Observability](../observability.md) — Logs and metrics for contract calls

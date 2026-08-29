# How to Repay a Loan

This guide explains how to repay an active loan on StellarKraal — covering partial repayment, full repayment, how repayment improves your health factor, and what happens at the repayment deadline.

> **Prerequisites**
> - An active loan with a Loan ID (visible on the [Loans](/loans) page).
> - [Freighter](https://www.freighter.app/) installed, unlocked, and set to the correct network.
> - Sufficient XLM/stroops in your wallet to cover the repayment amount plus transaction fees.

---

## Where to Repay

Navigate to your [Loans](/loans) page. Each active loan has a **Repay** button that opens the Repay Panel. You can also find the RepayPanel directly on the dashboard for quick access.

---

## Fields

| Field | Description |
|-------|-------------|
| Loan ID | The numeric ID of the loan you want to repay. Shown on the Loans page and in your confirmation email. |
| Amount (stroops) | How many stroops to repay. Must be greater than 0 and at most the outstanding balance. |

---

## Partial vs Full Repayment

### Partial repayment

A partial repayment reduces your outstanding balance without closing the loan. Use it when you want to:

- Improve your health factor to avoid liquidation risk.
- Pay down principal early to reduce future interest.
- Spread repayments across multiple transactions.

**Example:**  
Outstanding balance: 1,050,000 stroops (1,000,000 principal + 50,000 fee).  
You repay 500,000 stroops → new outstanding: 550,000 stroops. Loan stays **Active**.

### Full repayment

A full repayment clears the entire outstanding balance. The loan transitions from **Active** to **Repaid** and your collateral is released.

**Example:**  
Outstanding balance: 550,000 stroops.  
You repay 550,000 stroops → outstanding reaches 0 → loan status becomes **Repaid**. Collateral is unlocked.

> **Tip:** Always check the current outstanding balance on the Loans page before submitting. The balance includes principal plus any accrued fees. Entering an amount larger than the outstanding will be rejected by the contract.

---

## How Repayment Improves Your Health Factor

The health factor measures how safe your loan position is:

```
Health Factor = (collateral value × 0.80) / outstanding debt
```

When you repay, outstanding debt decreases, so the health factor rises.

### Repayment Calculator Example

| Scenario | Collateral Value | Outstanding | Health Factor |
|----------|-----------------|-------------|---------------|
| Before partial repayment | 10,000,000 stroops | 7,000,000 stroops | 1.14 ⚠️ |
| After repaying 2,000,000 | 10,000,000 stroops | 5,000,000 stroops | 1.60 ✅ |
| After full repayment | 10,000,000 stroops | 0 | ∞ (Repaid) |

A health factor below 1.0 means your position is eligible for liquidation. Partial repayments are a quick way to lift a falling health factor back into the safe zone without closing the loan entirely.

**Formula reference (on-chain):**

```
HF = (total_collateral_value × 8000) / (outstanding × 10_000) × 10_000
```

HF is expressed in basis points scaled by 10,000 — a value of 10,000 equals 1.0. See [Liquidation Mechanism](../protocol/liquidation.md) for the full technical specification.

---

## Repayment Deadlines

> **Note:** Automatic deadline enforcement (i.e., marking a loan defaulted if not repaid by the term end date) is planned but not yet implemented in the current contract version. This section will be updated when the feature ships.

What you can rely on today:

- Each loan has a term (7, 30, 90, or 180 days) set at origination.
- The backend records the due date and it is displayed on the Loans page.
- If you do not repay before the due date, the loan remains **Active** but may become eligible for liquidation if the health factor drops below 1.0 in the interim.
- The origination fee is charged at loan creation, not at repayment time — it is already baked into the outstanding balance.

**Best practice:** Set a reminder a few days before your loan's due date and ensure you have enough funds to repay in full.

---

## Step-by-Step: Making a Repayment

1. Go to [Loans](/loans) and find the loan you want to repay.
2. Note the **outstanding balance** displayed on the loan card.
3. Click **Repay** to open the Repay Panel.
4. Enter the **Loan ID** and the **amount** (in stroops) you want to repay.
5. Click **Repay**.
6. **Freighter pops up** — review the transaction and click Approve.
7. The app broadcasts the signed transaction.
8. On success, a toast notification confirms the repayment.
9. The loan card refreshes — the outstanding balance decreases (partial) or the loan is marked **Repaid** (full).

---

## What Happens On-Chain

When you submit a repayment, the Soroban contract executes the following:

1. Verifies the contract is not paused.
2. Checks the loan exists and is **Active**.
3. Validates `repay_amount > 0` and `repay_amount <= outstanding`.
4. Transfers `repay_amount` stroops from your wallet to the contract.
5. Reduces `outstanding` by `repay_amount`.
6. If `outstanding == 0`, transitions loan status to **Repaid** and releases collateral.
7. Emits a `loan/repaid` event that the backend listens to and syncs.

---

## FAQ / Common Issues

**Q: The Repay button shows a network mismatch warning.**  
Your Freighter wallet is connected to a different Stellar network than the app expects. Switch Freighter to the correct network (Testnet or Mainnet) and reconnect.

**Q: I entered the full outstanding amount but got an error saying "exceeds balance".**  
Amounts are in stroops. If you entered a value in XLM by mistake, multiply by 10,000,000. Also check that your wallet has enough XLM for the repayment plus the Stellar transaction fee (around 100 stroops).

**Q: My loan still shows as Active after full repayment.**  
Blockchain confirmation may take a few seconds. Wait and refresh the Loans page. If it persists after 30 seconds, check the transaction status in the [Stellar Expert explorer](https://stellar.expert/) using your transaction hash.

**Q: Can I repay someone else's loan?**  
The contract requires `borrower` to match the transaction signer. You can only repay your own loans via the UI. Direct contract invocation for third-party repayment is not supported by the current interface.

**Q: What happens to my collateral after full repayment?**  
Once outstanding reaches 0, the loan transitions to **Repaid** and the collateral is released from the contract. Collateral settlement is handled by the backend event listener upon receiving the on-chain `loan/repaid` event.

**Q: I want to repay ahead of schedule. Is there a prepayment penalty?**  
No. You can repay at any time with no penalty. Early full repayment frees your collateral immediately.

---

## Related Docs

- [How to Request a Loan](request-loan.md)
- [Understanding Liquidation](understanding-liquidation.md)
- [Liquidation Mechanism (technical)](../protocol/liquidation.md)
- [Smart Contract Interface](../contracts/stellarkraal-interface.md)
- [Troubleshooting](../troubleshooting.md)

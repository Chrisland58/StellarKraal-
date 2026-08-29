# How to Request a Loan

This guide walks you through every step of the loan request wizard on StellarKraal. The wizard has four steps: **Collateral → Amount → Review → Confirm**.

> **Prerequisites**
> - [Freighter](https://www.freighter.app/) browser extension installed and set to the correct network (Testnet or Mainnet).
> - At least one livestock asset you own that can serve as collateral.
> - Your wallet connected to StellarKraal (see the Connect Wallet button on the [Borrow page](/borrow)).

---

## Step 1 — Collateral

**What happens here:** You register one or more livestock items as on-chain collateral. This locks them against your loan and records them in the Soroban smart contract.

### Fields

| Field | Description |
|-------|-------------|
| Animal type | Select **Cattle**, **Goat**, or **Sheep** from the dropdown. |
| Number of animals | How many animals of that type you are pledging (minimum 1). |
| Total appraised value (stroops) | The combined appraised value of all animals in this row, in **stroops** (1 XLM = 10,000,000 stroops). Example: 5 cattle each valued at 200 XLM = 10,000,000,000 stroops. |

> **Stroops explained:** StellarKraal uses stroops (the smallest XLM denomination) for precision. To convert: multiply XLM by 10,000,000. A per-head estimate in XLM is shown beneath the value field as you type.

### Adding multiple collateral items

Click **+ Add item** to pledge more than one type of animal in a single request. You can drag rows to reorder them (or use ↑ / ↓ arrow keys on the drag handle). The order affects which collateral is pledged first in contract storage.

### What happens when you click "Register & Continue →"

1. The app calls `POST /api/collateral/register` with your animal details.
2. The backend builds a Soroban transaction XDR.
3. **Freighter pops up** — review and approve the signature.
4. The signed transaction is submitted to the Stellar network.
5. On success, your collateral ID is saved and you advance to Step 2.

**If registration fails:** Check that Freighter is unlocked and set to the right network. See [Troubleshooting](#faq--common-issues).

---

## Step 2 — Amount

**What happens here:** You choose how much to borrow and the loan term. The wizard calculates your LTV and health factor in real time.

### Fields

| Field | Description |
|-------|-------------|
| Loan amount (stroops) | How much you want to borrow. Cannot exceed the maximum shown (70% LTV). |
| Loan term | Choose 7, 30, 90, or 180 days. Longer terms carry a higher fee. |

### Key concepts

#### Loan-to-Value (LTV)

LTV is the ratio of what you borrow to the appraised value of your collateral, expressed as a percentage.

```
LTV = (loan amount / collateral value) × 100
```

**Example:** Collateral worth 10,000,000 stroops. Borrow 7,000,000 stroops → LTV = 70%.

The protocol caps the initial loan at **70% LTV**. This means you can borrow at most 70 stroops for every 100 stroops of collateral. The remaining 30% is a safety cushion — if collateral value drops, you have room before liquidation is triggered.

The LTV bar in the wizard turns yellow above 50% and red above 65% — a visual warning to keep some safety margin.

#### Health Factor

The health factor (HF) measures how safe your position is right now:

```
HF = (collateral value × 0.80) / loan amount
```

- **HF ≥ 1.0** — your loan is safe.
- **HF < 1.0** — your position is eligible for liquidation.

The wizard shows a live HF estimate as you type your loan amount:
- Green (≥ 1.5) — comfortable buffer.
- Yellow (1.0 – 1.5) — watch closely.
- Red (< 1.0) — already in danger; reduce the amount.

> The full health factor formula used by the contract is: `HF = (collateral_value × 8000) / (outstanding × 10_000) × 10_000`. See [Liquidation Mechanism](../protocol/liquidation.md) for the technical detail.

#### Origination Fee

The origination fee is deducted from your disbursement and depends on the term:

| Term | Fee rate |
|------|----------|
| 7 days | 2% |
| 30 days | 5% |
| 90 days | 12% |
| 180 days | 20% |

**Example:** Borrow 1,000,000 stroops for 30 days → fee = 50,000 stroops → you repay 1,050,000 stroops.

---

## Step 3 — Review

**What happens here:** A read-only summary of everything you entered. No transaction is submitted yet.

### Summary table

| Row | What it shows |
|-----|---------------|
| Collateral type | The animal type and emoji |
| Animal count | Number of animals pledged |
| Appraised value | Total collateral value in stroops |
| Loan amount | What you'll receive |
| Loan term | Duration in days |
| Fee rate | Percentage fee for this term |
| Fee amount | Stroops deducted as origination fee |
| **Total to repay** | Loan + fee (what you owe at maturity) |
| **Health factor** | Your estimated position safety ratio |

### Risk warning

A yellow warning box appears if your health factor is below 1.5, reminding you that collateral price drops could push your HF below 1.0 and trigger liquidation.

If you want to change anything, click **← Back** to return to the Amount or Collateral step.

---

## Step 4 — Confirm

**What happens here:** This is the final step. Clicking **Submit Loan Request** sends the actual on-chain transaction.

### What happens when you submit

1. The app calls `POST /api/loan/request` with your borrower address, collateral ID, amount, and term.
2. The backend builds a Soroban transaction XDR.
3. **Freighter pops up** — this is your last chance to review before signing. The transaction summary in Freighter shows the contract call.
4. Once you approve, the signed XDR is broadcast to the network.
5. On success, a **Loan Disbursed** confirmation screen shows your Loan ID and repayment details.

### After disbursement

- The borrowed amount is credited to your Stellar wallet.
- Your Loan ID is shown on screen — save it; you'll need it to repay.
- The loan appears in your [Loans](/loans) list.
- Keep an eye on your health factor via the dashboard. If collateral prices fall, repay or add collateral to stay above 1.0.

---

## FAQ / Common Issues

**Q: Freighter didn't open. What do I do?**  
Make sure the Freighter extension is installed, unlocked, and the active account matches the wallet you connected. Refresh the page and try again. For persistent issues, see [docs/troubleshooting.md](../troubleshooting.md).

**Q: I see "Registration failed. Please try again."**  
This usually means the network request to the backend failed or Freighter rejected the signature. Check your network connection, confirm you're on the right Stellar network (testnet vs. mainnet), and retry.

**Q: Why can't I borrow more than 70% of my collateral value?**  
The 70% LTV cap is enforced by the smart contract to ensure there is always a collateral buffer above the liquidation threshold (80%). Without this buffer, a small price drop could immediately trigger liquidation.

**Q: What is the difference between LTV and the health factor?**  
LTV is a one-time measure at origination — it tells you how much you're borrowing relative to collateral at that moment. The health factor is a live ongoing ratio that changes as collateral prices move and interest accrues. LTV determines the loan cap; health factor determines whether you're at risk of liquidation.

**Q: The wizard shows my health factor in red. Should I proceed?**  
No. A red health factor means you're already below 1.0 — your position would be immediately liquidatable. Reduce your loan amount until the health factor turns green.

**Q: I completed the wizard but I don't see the loan in my dashboard.**  
The loan list refreshes automatically, but blockchain confirmation can take a few seconds. Wait a moment and refresh. If the loan still doesn't appear, check the Loan ID shown on the confirmation screen against `GET /api/loans?borrower=<your-address>`.

**Q: Can I cancel after clicking "Submit Loan Request"?**  
Once you approve the signature in Freighter and the transaction is broadcast, it cannot be cancelled on-chain. If it hasn't been signed yet, dismiss Freighter to abort.

**Q: Are the appraised values set by me or by an oracle?**  
For the collateral registration step, you provide the appraised value. The on-chain oracle independently validates and may override collateral prices for health factor and liquidation calculations. See [ADR-006](../adr/ADR-006-oracle-design.md) for the oracle model.

---

## Related Docs

- [How to Repay a Loan](repay-loan.md)
- [Understanding Liquidation](understanding-liquidation.md)
- [Liquidation Mechanism (technical)](../protocol/liquidation.md)
- [Smart Contract Interface](../contracts/stellarkraal-interface.md)
- [Troubleshooting](../troubleshooting.md)

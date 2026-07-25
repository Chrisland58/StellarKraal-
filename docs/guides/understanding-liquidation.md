# Understanding Liquidation

This guide explains liquidation in plain language — what it is, when it happens, how the health factor works, and what you can do to protect your position.

---

## What Is Liquidation?

Liquidation is the process by which a third party (a "liquidator") repays part or all of your loan when your collateral is no longer worth enough to safely back it.

Think of it like a margin call: if the value of what you've pledged as collateral drops too low relative to what you owe, the protocol allows others to step in, pay off your debt, and claim your collateral in return.

**Liquidation does not happen automatically based on time.** It is only triggered when the health factor of your loan drops below 1.0.

---

## The Health Factor

The health factor (HF) is a single number that tells you how safe your loan is right now. A higher number means a safer position.

```
Health Factor = (collateral value × 80%) / outstanding debt
```

| Health Factor | What it means |
|--------------|---------------|
| ≥ 1.5 | Safe — comfortable buffer |
| 1.0 – 1.5 | Warning zone — monitor closely |
| < 1.0 | **Liquidatable** — anyone can liquidate |
| undefined (debt = 0) | Fully repaid — cannot be liquidated |

**The critical threshold is 1.0.** Once your health factor drops below 1.0, your loan is eligible for liquidation at any time.

---

## When Does Liquidation Occur?

Liquidation becomes possible when:

1. The **appraised value of your collateral falls**, reducing the numerator of the health factor formula.
2. **Outstanding debt increases** (through interest accrual), increasing the denominator.
3. Both happen at the same time.

The 80% factor in the formula is the liquidation threshold — the protocol requires your collateral to cover at least 80% of the outstanding debt for the health factor to stay at or above 1.0.

---

## Worked Example

### Starting position

You have 5 cattle appraised at **200 XLM each** (total: **1,000 XLM**).  
You borrow **600 XLM** (60% LTV).

```
Health Factor = (1,000 × 0.80) / 600
             = 800 / 600
             = 1.33  ✅ Safe
```

### After a 30% price drop

Cattle prices fall. Each animal is now worth 140 XLM (total: **700 XLM**).

```
Health Factor = (700 × 0.80) / 600
             = 560 / 600
             = 0.93  ⚠️ LIQUIDATABLE
```

Your health factor dropped below 1.0. A liquidator can now call `liquidate` on your loan.

### What the liquidator does

The liquidator repays up to **50%** of your outstanding debt in one transaction (this is called the "close factor" — it limits how much can be liquidated at once, giving you a chance to recover).

```
Max repayment = 600 XLM × 50% = 300 XLM
```

After the liquidator repays 300 XLM:

```
Health Factor = (700 × 0.80) / 300
             = 560 / 300
             = 1.87  ✅ Safe again
```

Your loan is now 300 XLM outstanding instead of 600 XLM. It stays **Active** — you still owe the remaining 300 XLM.

### Full liquidation scenario

If collateral falls so far that two rounds of partial liquidation bring outstanding to zero, the loan transitions to **Liquidated** status and your collateral is released to the liquidator.

---

## How to Avoid Liquidation

There are two actions you can take before your health factor reaches 1.0:

### 1. Repay part of your loan

Reducing your outstanding debt directly increases the health factor.

**Example:** If your health factor is 1.05 and you want to reach 1.5:

```
Target: HF = 1.5
1.5 = (700 × 0.80) / new_outstanding
new_outstanding = 560 / 1.5 = 373 XLM

You need to repay: 600 - 373 = 227 XLM
```

See [How to Repay a Loan](repay-loan.md) for step-by-step repayment instructions.

### 2. Add more collateral

Registering additional collateral increases the collateral value in the numerator, raising your health factor.

> Adding collateral is done via the Collateral step in the [Loan Request Wizard](request-loan.md) for new loans, or through the Collateral management page for existing positions (feature roadmap).

### Monitoring your health factor

- The **Dashboard** shows a live HealthGauge for each active loan.
- The gauge turns yellow below 1.5 and red below 1.0.
- You will receive a notification (if configured) when your health factor falls below the warning threshold.

**Best practice:** Set a personal alert at HF = 1.2 so you have time to act before reaching the 1.0 liquidation boundary.

---

## Key Terms Glossary

**Health Factor (HF):** A ratio measuring position safety. Below 1.0 triggers liquidation eligibility.

**Liquidation Threshold (80%):** The protocol parameter controlling the safety margin. The contract uses 8,000 basis points (80%).

**Close Factor (50%):** The maximum percentage of outstanding debt that can be repaid in a single liquidation call. Limits impact and preserves a chance for the borrower to self-cure.

**LTV (Loan-to-Value):** The ratio of the loan amount to collateral value at origination. The protocol caps initial loans at 70% LTV, providing a 10 percentage-point buffer before the 80% liquidation threshold.

**Liquidator:** Any address that calls the `liquidate` function on the contract when HF < 1.0. Liquidators are incentivized by acquiring collateral at below-market prices.

---

## FAQ

**Q: Will I receive a warning before liquidation happens?**  
The dashboard's HealthGauge shows your live health factor and turns red when you approach the threshold. Notifications can be configured in Settings. However, liquidation itself is permissionless — any address can trigger it the moment HF drops below 1.0, so watching the gauge is your main defence.

**Q: Can I be liquidated for the full amount at once?**  
No. The close factor limits any single liquidation call to 50% of your outstanding debt. After a partial liquidation your health factor may recover above 1.0, stopping further liquidations automatically.

**Q: Does liquidation always wipe out my entire collateral?**  
Not necessarily. If a partial liquidation restores your health factor above 1.0, your remaining collateral stays locked to the reduced loan. Full collateral loss only happens if the outstanding debt reaches zero via successive liquidations.

**Q: What happens to my loan after liquidation?**  
- **Partial:** Loan stays Active with reduced outstanding.
- **Full (outstanding = 0):** Loan status transitions to **Liquidated**. Collateral is released to the liquidator. You keep any amount you already received as the loan disbursement.

**Q: Is there a liquidation bonus?**  
The current contract version does not apply an on-chain liquidation bonus. Liquidator incentive is the below-market collateral acquisition, negotiated off-chain via the oracle/settlement layer.

**Q: How quickly can prices move and trigger liquidation?**  
The protocol uses a TWAP (Time-Weighted Average Price) for liquidation decisions — it averages prices over a 1-hour window. This prevents a single-transaction flash crash from instantly triggering liquidation. A real sustained price drop over the window can still push HF below 1.0. See [TWAP Mechanism](../protocol/twap-mechanism.md) for details.

---

## Related Docs

- [How to Request a Loan](request-loan.md)
- [How to Repay a Loan](repay-loan.md)
- [Liquidation Mechanism (technical)](../protocol/liquidation.md)
- [TWAP Mechanism](../protocol/twap-mechanism.md)
- [Smart Contract Interface](../contracts/stellarkraal-interface.md)

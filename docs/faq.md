# StellarKraal FAQ

> This file is the source of truth for the in-app FAQ at `/help/faq`.

Borrower questions are grouped below. Answers use plain language and reflect current product behavior.

---

## Eligibility

**Q: Who can borrow on StellarKraal?**  
A: Any Stellar account holder who can sign transactions with Freighter and register eligible livestock as collateral. You must complete on-chain registration before requesting a loan.

**Q: Do I need a special account to get started?**  
A: You need the Freighter browser extension and a funded Stellar account on the same network the app uses (Testnet for testing, Mainnet for production). Create or import a wallet in Freighter, then click Connect Wallet in the app.

**Q: Can I borrow without registering collateral?**  
A: No. Loans are backed by livestock you register on-chain first. The Borrow flow walks you through collateral registration, then loan request.

**Q: Are there geographic restrictions?**  
A: The protocol is open on-chain, but you are responsible for complying with local laws for livestock ownership and lending. The app does not verify your location.

---

## Collateral

**Q: What animals can I register as collateral?**  
A: Cattle, goats, and sheep are supported animal types in the registration form. Choose the type that matches your herd when you register.

**Q: How is my livestock appraised?**  
A: You enter an appraised value when registering. Oracle price updates can refresh valuations over time; the protocol uses collateral value when checking loan health.

**Q: Can I register multiple animals in one transaction?**  
A: Yes. Set the **Count** field to the number of animals. They are stored as one collateral record with a combined appraised value.

**Q: Can I use more than one collateral record for a loan?**  
A: The API supports requesting a loan against multiple collateral IDs in one request. In the app, register each herd separately, then include the IDs you need when borrowing.

**Q: Can I update or remove my collateral?**  
A: Collateral linked to an active loan cannot be removed. After you fully repay the loan, the collateral can be released.

**Q: What is a collateral ID?**  
A: A unique on-chain identifier assigned when you register. Save it—you need it to request a loan and to look up your position on the Dashboard.

---

## Loan Limits

**Q: What is the maximum I can borrow?**  
A: By default you can borrow up to about **60%** of your collateral’s appraised value (loan-to-value ratio). The smart contract enforces the cap when you submit a loan request.

**Q: What happens if I ask for more than the limit?**  
A: The contract rejects the request. Lower the amount or register additional collateral with a higher total appraised value.

**Q: Is there a minimum loan amount?**  
A: The amount must be a positive number. Very small loans may not be practical after network fees.

**Q: Is there an origination fee?**  
A: Yes. A small origination fee (**0.5%** by default) is deducted when the loan is created.

---

## Interest Rates

**Q: How is my interest rate determined?**  
A: The protocol uses a utilization-based model: rates move with how much of the pool is borrowed. Low utilization tends to mean lower rates; high utilization increases rates to encourage repayment.

**Q: Will my rate change after I take a loan?**  
A: Interest accrues on your outstanding balance according to the contract. Market utilization can change over time, which affects how interest builds on open loans.

**Q: Are there fees when I repay?**  
A: A fee applies to the **interest portion** of your repayment (**10%** by default). Principal repayment is not subject to that interest fee.

**Q: Where can I see fees before I repay?**  
A: Use the **Loan Repayment Calculator** on the Dashboard or the repayment preview API to see principal, interest, fees, and remaining balance before you sign.

---

## Repayment

**Q: How do I repay my loan?**  
A: Open the **Repay** panel on the Dashboard, enter the amount, and sign the transaction in Freighter.

**Q: Can I repay partially?**  
A: Yes. Pay any amount up to your full outstanding balance. Partial payments reduce debt and usually improve your health factor.

**Q: Is there a fixed payment schedule?**  
A: No mandatory monthly schedule. You choose when to repay. If collateral value falls, liquidation risk can increase even without calendar due dates.

**Q: How do I find my Loan ID?**  
A: It is shown after a successful loan request. You can also use the Dashboard **Loan Lookup** with your collateral ID.

**Q: What happens when the loan is fully repaid?**  
A: Outstanding debt goes to zero, the loan is closed, and your collateral is no longer tied to that loan.

---

## Liquidation

**Q: What is liquidation?**  
A: If your position becomes undercollateralized, a liquidator can repay part of your debt and receive collateral. This protects lenders from bad debt.

**Q: How is the health factor calculated?**  
A: The app shows health as a multiple where **1.00** is the danger line. Above 1.00 is healthy; below 1.00 means liquidators may act.

**Q: How do I avoid liquidation?**  
A: Watch the health gauge on the Dashboard. If it nears 1.00, repay some debt or add collateral.

**Q: Can someone liquidate my whole loan at once?**  
A: Liquidations are partial by default (up to half of outstanding debt per call). Multiple liquidations may be needed if the position stays unhealthy.

**Q: Who can liquidate my position?**  
A: Anyone can call liquidation when your health factor is below the threshold. The process is permissionless on-chain.

**Q: Will I be notified before liquidation?**  
A: The Dashboard warns when health is at risk. Review notification preferences on the **Settings** page; delivery depends on your deployment.

---

## Account

**Q: Which wallet do I need?**  
A: [Freighter](https://www.freighter.app/) is the supported browser wallet.

**Q: How do I connect my wallet?**  
A: Click **Connect Wallet** and approve the connection in Freighter.

**Q: Is my private key shared with StellarKraal?**  
A: No. Freighter signs transactions locally. The app never receives your secret key.

**Q: What network should Freighter use?**  
A: Match the app: **Testnet** for testing, **Mainnet** for real funds (`NEXT_PUBLIC_NETWORK`).

**Q: Can I switch wallets?**  
A: Disconnect and connect a different Freighter account. Each address has its own collateral and loan history.

**Q: Why does my balance look wrong briefly?**  
A: Balances come from the Stellar network. Wait a few seconds and refresh after a transaction.

---

## General

**Q: Which blockchain does StellarKraal use?**  
A: Stellar with Soroban smart contracts (Testnet for staging, Mainnet for production).

**Q: How do I report a bug?**  
A: Open a GitHub issue. For security vulnerabilities, follow **SECURITY.md**.

**Q: Is there an API for developers?**  
A: Yes. REST endpoints under `/api/v1/`; Swagger UI at `/api/docs` when the API is running.

**Q: Where is this FAQ in the repo?**  
A: `docs/faq.md` (this file) and the in-app page at `/help/faq`.

**Q: What does "stroops" mean?**  
A: The smallest unit of XLM (1 XLM = 10,000,000 stroops).

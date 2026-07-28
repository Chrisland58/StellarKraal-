# Glossary

Definitions of financial and protocol terms used throughout StellarKraal.

---

## A

### APR (Annual Percentage Rate)
The annualized cost of borrowing, expressed as a percentage. In StellarKraal, the APR is determined by the [interest rate model](protocol/interest-rate-model.md), which uses a jump-rate curve with a kink. See also [Interest Rate](#interest-rate), [Origination Fee](#origination-fee).

### Appraisal
The estimated market value of livestock used as collateral. Appraisals are performed off-chain and recorded when collateral is registered. The appraisal value determines how much can be borrowed against an animal. See also [Collateral](#collateral), [LTV](#ltv-loan-to-value).

### At-Risk
A loan status indicating the health factor has fallen below the warning threshold but above the liquidation threshold. The loan is still active but flagged for monitoring. See also [Health Factor](#health-factor), [Liquidation](#liquidation).

## B

### Borrower
A user who pledges livestock as collateral and receives a loan against its appraised value. The borrower is responsible for repayment and monitoring their [Health Factor](#health-factor).

## C

### Close Factor
The maximum portion of a loan's outstanding balance that can be repaid in a single liquidation event, expressed as a basis point (e.g., 5000 = 50%). This prevents a single liquidator from taking over the entire position. See also [Liquidation](#liquidation).

### Collateral
Assets pledged by a borrower to secure a loan. In StellarKraal, collateral is livestock registered on-chain. If the borrower defaults, the collateral can be seized through [Liquidation](#liquidation). See also [Appraisal](#appraisal).

### Collateralization Ratio
The ratio between the value of your collateral and your outstanding loan. A higher ratio means a safer loan position. Calculated as `collateral_value / outstanding_balance`. See also [Health Factor](#health-factor), [LTV](#ltv-loan-to-value).

### Collateral Lock
The on-chain mechanism that prevents registered collateral from being used in multiple loans simultaneously. Once a loan is [Repaid](#repayment) or [Liquidated](#liquidation), the collateral is released. See also [Collateral](#collateral).

### Contract ID
The unique identifier of the deployed Soroban smart contract on the Stellar network. Required for the backend and frontend to interact with the on-chain loan logic. See also [Soroban](#soroban).

## D

### Disbursement
The transfer of loan funds from the protocol to the borrower's wallet, triggered when a loan request is confirmed on-chain. The disbursed amount equals the loan amount minus the [Origination Fee](#origination-fee).

## F

### Freighter
A Stellar wallet browser extension that allows users to sign transactions and interact with Soroban contracts from the web frontend. See also [Wallet](#wallet).

## H

### Health Factor (HF)
A numeric representation of a loan's safety. Calculated as `(collateral_value * liquidation_threshold) / outstanding_balance`, scaled by 10,000 (basis points). A value below 10,000 means the loan is eligible for [Liquidation](#liquidation). See also [Collateralization Ratio](#collateralization-ratio), [Liquidation Threshold](#liquidation-threshold).

## I

### Interest Rate
The cost of borrowing funds, calculated using a jump-rate model with a kink. Below the kink utilization, rates are low; above the kink, rates increase steeply to encourage repayments. See also [APR](#apr-annual-percentage-rate).

### InvalidTransitionError
An error thrown by the backend [Loan State Machine](protocol/loan-state-machine.md) when an invalid loan status transition is attempted (e.g., trying to move from `repaid` back to `active`).

## J

### Jump-Rate Model
An [interest rate](#interest-rate) model where the rate increases slowly up to a target utilization rate (the "kink"), then increases sharply beyond it. This incentivizes borrowers to maintain healthy utilization. See also [APR](#apr-annual-percentage-rate).

## L

### Ledger
A sequential block in the Stellar network that contains transactions. The [contract event listener](guides/contract-event-listener.md) tracks the last processed ledger to avoid re-processing events. See also [Soroban](#soroban).

### Ledger Cursor
A pointer to the last processed ledger sequence number. The event listener persists this cursor to enable replay from the correct position after a restart. See also [Ledger](#ledger).

### Liquidation
The process of closing an under-collateralized loan by repaying the outstanding balance on behalf of the borrower and seizing the collateral. Can be partial or full. See also [Close Factor](#close-factor), [Health Factor](#health-factor), [Liquidator](#liquidator).

### Liquidation Threshold
The minimum ratio of collateral value to loan value required to keep a loan safe. Represented as a basis point (e.g., 8000 = 80%). Below this threshold, the loan becomes eligible for [Liquidation](#liquidation). See also [Health Factor](#health-factor), [LTV](#ltv-loan-to-value).

### Liquidator
A user or bot that repays an under-collateralized loan's outstanding balance in exchange for seizing the borrower's collateral. Liquidators can be whitelisted by the protocol admin. See also [Liquidation](#liquidation).

### Loan Status
The current state of a loan in the [Loan State Machine](protocol/loan-state-machine.md): `Pending`, `Active`, `At-Risk`, `Repaid`, or `Liquidated`. Terminal states are `Repaid` and `Liquidated`.

### Loan-to-Value (LTV)
The maximum percentage of collateral value that can be borrowed. For example, a 70% LTV means a borrower can receive up to 70% of the collateral's appraised value as a loan. See also [Collateral](#collateral), [Liquidation Threshold](#liquidation-threshold).

## M

### Multi-Oracle Median
A price feed mechanism that aggregates prices from multiple oracle sources and takes the median value. This reduces the impact of any single oracle failure or manipulation. See also [TWAP](#twap-time-weighted-average-price).

## O

### Oracle
An external data provider that supplies price information to the smart contract. StellarKraal uses a [multi-oracle median](#multi-oracle-median) design for price resilience. See also [TWAP](#twap-time-weighted-average-price).

### Origination Fee
A one-time fee charged when a loan is created, deducted from the [Disbursement](#disbursement). Typically expressed as a percentage of the loan amount.

### Outstanding Balance
The remaining amount owed on a loan, including principal and accrued interest. When this reaches zero, the loan is fully [Repaid](#repayment).

## P

### Pending
An off-chain loan state before the `request_loan` transaction is confirmed on-chain. The loan exists in the backend database but not yet on the Soroban contract. See also [Loan Status](#loan-status).

### Polling Interval
The time between successive checks for new contract events by the [contract event listener](guides/contract-event-listener.md). Configurable via the `EVENT_POLL_INTERVAL_MS` environment variable (default: 5000ms).

## R

### Repayment
The act of paying back part or all of a loan's [Outstanding Balance](#outstanding-balance). Partial repayments reduce the balance but keep the loan active; full repayment moves the loan to the terminal `Repaid` state.

### RPC (Remote Procedure Call)
The Soroban JSON-RPC endpoint used by the backend to query contract state, submit transactions, and listen for contract events. Configured via `RPC_URL`.

## S

### Soroban
Stellar's smart contract platform that runs WebAssembly (WASM) contracts. StellarKraal's loan lifecycle is managed by a Soroban contract written in Rust. See also [Contract ID](#contract-id).

## T

### TWAP (Time-Weighted Average Price)
A price feed mechanism that averages oracle prices over a time window, reducing the impact of short-term price volatility. Used for [Liquidation](#liquidation) price calculations. See also [Oracle](#oracle), [Multi-Oracle Median](#multi-oracle-median).

### TransitionRecord
A record of a loan status change in the backend, containing `from`, `to`, and `at` (ISO timestamp). Stored in the loan's [Transition History](#transition-history). See also [Loan State Machine](protocol/loan-state-machine.md).

### Transition History
An ordered list of [TransitionRecords](#transitionrecord) tracking every status change a loan has undergone, used for auditing and debugging.

## U

### Utilization Rate
The ratio of total outstanding loans to total available liquidity. In the jump-rate model, this determines the current [Interest Rate](#interest-rate).

## W

### Wallet
A Stellar account used to hold funds and sign transactions. StellarKraal integrates with [Freighter](#freighter) for browser-based wallet access.

### Whitelist
An access control mechanism that restricts which addresses can perform [Liquidation](#liquidation). When the liquidator whitelist is empty, the protocol operates in open mode (anyone can liquidate).

---

## See Also

- [Loan State Machine](protocol/loan-state-machine.md)
- [Liquidation Mechanism](protocol/liquidation.md)
- [Interest Rate Model](protocol/interest-rate-model.md)
- [Contract Events Reference](protocol/events.md)
- [Smart Contract Interface](contracts/stellarkraal-interface.md)

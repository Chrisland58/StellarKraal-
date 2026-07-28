# User Guides

Step-by-step guides for borrowers using the StellarKraal protocol.

## Borrower Guides

| Guide | Description |
|-------|-------------|
| [How to Request a Loan](request-loan.md) | Walks through all four wizard steps: Collateral, Amount, Review, Confirm. Explains LTV, health factor, and origination fee in plain language. Includes an FAQ for common issues. |
| [How to Repay a Loan](repay-loan.md) | Covers partial vs full repayment, how repayment improves the health factor, repayment deadlines, and a repayment calculator example. |
| [Understanding Liquidation](understanding-liquidation.md) | Borrower-facing explainer of the health factor, when liquidation occurs, a worked numeric example, and how to avoid liquidation. |

## Developer / Operator Guides

| Guide | Description |
|-------|-------------|
| [Environment Variables](environment-variables.md) | All environment variables required to run the backend, frontend, and contracts. |
| [Docker Setup](docker.md) | Running StellarKraal with Docker and Docker Compose. |
| [API Integration Tutorial](api-integration-tutorial.md) | How an external app registers collateral, requests a loan, and monitors loan status via webhooks. |
| [Register Collateral (English)](en/register-collateral.md) | English-language collateral registration walkthrough. |
| [Register Collateral (Swahili)](sw/register-collateral.md) | Swahili-language collateral registration walkthrough. |
| [Adding a New Animal Type](adding-animal-type.md) | End-to-end process for adding a new supported collateral animal type across contract, backend, and frontend. |
| [CHANGELOG Guide](changelog.md) | How to format and place a new `CHANGELOG.md` entry. |
| [Handling Dependabot PRs](dependabot.md) | Triage, review, and merge process for automated dependency update PRs. |
| [Load Testing a Live Environment](load-testing.md) | How to load test a deployed (e.g. staging) environment, as opposed to on-chain benchmarks. |
| [Idempotency Keys](idempotency.md) | How to generate and use `Idempotency-Key` headers for safe retries on write endpoints. Includes UUID v4 examples and replay behaviour. |
| [Monitoring and Alerting](alerting.md) | Alert rule structure, Slack/PagerDuty integration, cooldown deduplication, and step-by-step guide to adding a new alert rule. |
| [Response Cache Middleware](response-cache.md) | Which endpoints are cached, how cache keys are built, bypassing the cache, manual invalidation, and thundering-herd considerations. |

---

Back to [README](../../README.md)

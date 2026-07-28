// Full glossary with 35+ terms available at: docs/glossary.md
// This file powers the /help/glossary page in the frontend.

export const glossaryTerms = {
  healthFactor: {
    id: "health-factor",
    term: "Health Factor",
    definition:
      "A numeric representation of your loan's safety. A value below 1.0 means your collateral can be liquidated.",
  },
  collateralizationRatio: {
    id: "collateralization-ratio",
    term: "Collateralization Ratio",
    definition:
      "The ratio between the value of your collateral and your outstanding loan. Higher ratios mean a safer loan.",
  },
  liquidationThreshold: {
    id: "liquidation-threshold",
    term: "Liquidation Threshold",
    definition:
      "The minimum collateral value required to keep your loan safe. If your collateral value falls below this point, liquidation can occur.",
  },
  ltv: {
    id: "ltv",
    term: "LTV (Loan-to-Value)",
    definition:
      "The maximum amount you can borrow against your collateral. For example, a 70% LTV means you can borrow up to 70% of the collateral's value.",
  },
  apr: {
    id: "apr",
    term: "APR (Annual Percentage Rate)",
    definition:
      "The annualized cost of borrowing, expressed as a percentage. It represents the yearly interest rate you pay on your loan.",
  },
  appraisal: {
    id: "appraisal",
    term: "Appraisal",
    definition:
      "The estimated market value of livestock used as collateral. Appraisals are performed off-chain when registering collateral.",
  },
  collateral: {
    id: "collateral",
    term: "Collateral",
    definition:
      "Assets pledged by a borrower to secure a loan. In StellarKraal, livestock registered on-chain serves as collateral.",
  },
  liquidation: {
    id: "liquidation",
    term: "Liquidation",
    definition:
      "The process of closing an under-collateralized loan by repaying the balance on behalf of the borrower and seizing the collateral.",
  },
  liquidator: {
    id: "liquidator",
    term: "Liquidator",
    definition:
      "A user or bot that repays an under-collateralized loan in exchange for seizing the borrower's collateral.",
  },
  closeFactor: {
    id: "close-factor",
    term: "Close Factor",
    definition:
      "The maximum portion of a loan's outstanding balance that can be repaid in a single liquidation event, preventing a single liquidator from taking the entire position.",
  },
  outstandingBalance: {
    id: "outstanding-balance",
    term: "Outstanding Balance",
    definition:
      "The remaining amount owed on a loan, including principal and accrued interest. When this reaches zero, the loan is fully repaid.",
  },
  originationFee: {
    id: "origination-fee",
    term: "Origination Fee",
    definition:
      "A one-time fee charged when a loan is created, deducted from the disbursement amount.",
  },
  disbursement: {
    id: "disbursement",
    term: "Disbursement",
    definition:
      "The transfer of loan funds to the borrower's wallet, equal to the loan amount minus the origination fee.",
  },
  soroban: {
    id: "soroban",
    term: "Soroban",
    definition:
      "Stellar's smart contract platform. StellarKraal's loan lifecycle is managed by a Soroban contract written in Rust.",
  },
  twap: {
    id: "twap",
    term: "TWAP (Time-Weighted Average Price)",
    definition:
      "A price feed that averages oracle prices over a time window, reducing the impact of short-term volatility.",
  },
  oracle: {
    id: "oracle",
    term: "Oracle",
    definition:
      "An external data provider that supplies price information to the smart contract. StellarKraal uses multi-oracle median aggregation.",
  },
  freighter: {
    id: "freighter",
    term: "Freighter",
    definition:
      "A Stellar wallet browser extension that lets you sign transactions and interact with Soroban contracts from the web.",
  },
  atRisk: {
    id: "at-risk",
    term: "At-Risk",
    definition:
      "A loan status indicating the health factor has dropped below the warning threshold but is not yet eligible for liquidation.",
  },
  loanStatus: {
    id: "loan-status",
    term: "Loan Status",
    definition:
      "The current state of a loan: Pending, Active, At-Risk, Repaid, or Liquidated. Terminal states are Repaid and Liquidated.",
  },
  repayment: {
    id: "repayment",
    term: "Repayment",
    definition:
      "The act of paying back part or all of a loan's outstanding balance. Partial repayments keep the loan active; full repayment closes it.",
  },
  whitelist: {
    id: "whitelist",
    term: "Whitelist",
    definition:
      "An access control list for liquidators. When empty, the protocol operates in open mode (anyone can liquidate).",
  },
} as const;

export const glossaryArray = Object.values(glossaryTerms);

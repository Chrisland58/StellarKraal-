/**
 * WIZARD_FIELD_TOOLTIPS — #557
 *
 * Plain-language help text for LoanWizard form fields.
 *
 * Sourced from this constants file (not hardcoded inline) so copy can be
 * updated in one place and reused across steps.
 */

export const WIZARD_FIELD_TOOLTIPS = {
  // ── StepCollateral ──────────────────────────────────────────────────────────

  animalType: 'The species of livestock you are pledging as collateral. Different animal types have different appraisal values.',

  appraisedValue:
    'The estimated market value of your livestock in XLM stroops, assessed by an accredited appraiser. This value determines the maximum loan you can request (up to 70% of the appraised value).',

  quantity:
    'The number of animals of this type you are pledging. More collateral can increase the loan amount available to you.',

  location:
    'The GPS coordinates or farm address where the collateral animals are held. This is required for verification purposes.',

  // ── StepAmount ──────────────────────────────────────────────────────────────

  loanAmount:
    'The amount you wish to borrow, in XLM stroops (1 XLM = 10,000,000 stroops). The maximum is 70% of your total appraised collateral value.',

  ltvRatio:
    'Loan-to-Value ratio — the percentage of your collateral value that you are borrowing. A lower LTV gives you a healthier buffer before liquidation risk.',

  loanTerm:
    'The length of time you have to repay the loan. Longer terms have higher origination fees but give you more time to repay.',

  healthFactor:
    'A measure of how safe your loan position is. A health factor above 1.5 means your collateral comfortably covers the loan. If it drops to 1.0 or below, your collateral may be liquidated.',

  originationFee:
    'A one-time fee charged when the loan is issued. It is a percentage of the principal and varies by loan term.',

  // ── StepReview ──────────────────────────────────────────────────────────────

  principalAmount:
    'The total amount being borrowed before any fees are applied.',

  totalRepayable:
    'The full amount you will need to repay, including the principal, origination fee, and estimated interest.',

  // ── StepConfirm ─────────────────────────────────────────────────────────────

  onChainSignature:
    'Your Freighter wallet signature authorises the on-chain smart contract transaction. No funds can move without your explicit approval.',
} as const;

export type WizardFieldTooltipKey = keyof typeof WIZARD_FIELD_TOOLTIPS;

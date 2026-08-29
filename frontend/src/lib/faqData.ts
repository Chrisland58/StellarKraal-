export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'eligibility',
    label: 'Eligibility',
    items: [
      {
        q: 'Who can borrow on StellarKraal?',
        a: 'Any Stellar account holder who can sign transactions with Freighter and register eligible livestock as collateral. You must complete on-chain registration before requesting a loan.',
      },
      {
        q: 'Do I need a special account to get started?',
        a: 'You need the Freighter browser extension and a funded Stellar account on the same network the app uses (Testnet for testing, Mainnet for production). Create or import a wallet in Freighter, then click Connect Wallet in the app.',
      },
      {
        q: 'Can I borrow without registering collateral?',
        a: 'No. Loans are backed by livestock you register on-chain first. The Borrow flow walks you through collateral registration, then loan request.',
      },
      {
        q: 'Are there geographic restrictions?',
        a: 'The protocol is open on-chain, but you are responsible for complying with local laws for livestock ownership and lending. The app does not verify your location.',
      },
    ],
  },
  {
    id: 'collateral',
    label: 'Collateral',
    items: [
      {
        q: 'What animals can I register as collateral?',
        a: 'Cattle, goats, and sheep are supported animal types in the registration form. Choose the type that matches your herd when you register.',
      },
      {
        q: 'How is my livestock appraised?',
        a: 'You enter an appraised value when registering. Oracle price updates can refresh valuations over time; the protocol uses collateral value when checking loan health.',
      },
      {
        q: 'Can I register multiple animals in one transaction?',
        a: 'Yes. Set the Count field to the number of animals. They are stored as one collateral record with a combined appraised value.',
      },
      {
        q: 'Can I use more than one collateral record for a loan?',
        a: 'The API supports requesting a loan against multiple collateral IDs in one request. In the app, register each herd separately, then include the IDs you need when borrowing.',
      },
      {
        q: 'Can I update or remove my collateral?',
        a: 'Collateral linked to an active loan cannot be removed. After you fully repay the loan, the collateral can be released.',
      },
      {
        q: 'What is a collateral ID?',
        a: 'A unique on-chain identifier assigned when you register. Save it—you need it to request a loan and to look up your position on the Dashboard.',
      },
    ],
  },
  {
    id: 'loan-limits',
    label: 'Loan Limits',
    items: [
      {
        q: 'What is the maximum I can borrow?',
        a: 'By default you can borrow up to about 60% of your collateral’s appraised value (loan-to-value ratio). The exact cap is enforced by the smart contract when you submit a loan request.',
      },
      {
        q: 'What happens if I ask for more than the limit?',
        a: 'The contract rejects the request. Lower the amount or register additional collateral with a higher total appraised value.',
      },
      {
        q: 'Is there a minimum loan amount?',
        a: 'The amount must be a positive number. Very small loans may not be practical after network fees; use an amount that makes sense for your herd and fees.',
      },
      {
        q: 'Is there an origination fee?',
        a: 'Yes. A small origination fee (0.5% by default) is deducted when the loan is created. You receive the loan amount minus that fee.',
      },
    ],
  },
  {
    id: 'interest-rates',
    label: 'Interest Rates',
    items: [
      {
        q: 'How is my interest rate determined?',
        a: 'The protocol uses a utilization-based model: rates move with how much of the pool is borrowed. When utilization is low, rates tend to be lower; when utilization is high, rates increase to encourage repayment.',
      },
      {
        q: 'Will my rate change after I take a loan?',
        a: 'Interest accrues on your outstanding balance according to the contract rules. Market utilization can change over time, which affects how interest builds on open loans.',
      },
      {
        q: 'Are there fees when I repay?',
        a: 'A fee applies to the interest portion of your repayment (10% by default). Principal repayment is not subject to that interest fee.',
      },
      {
        q: 'Where can I see fees before I repay?',
        a: 'Use the Loan Repayment Calculator on the Dashboard or the repayment preview API to see principal, interest, fees, and remaining balance before you sign a transaction.',
      },
    ],
  },
  {
    id: 'repayment',
    label: 'Repayment',
    items: [
      {
        q: 'How do I repay my loan?',
        a: 'Open the Repay panel on the Dashboard, enter the amount, and sign the transaction in Freighter. Repayments are submitted on-chain like other actions.',
      },
      {
        q: 'Can I repay partially?',
        a: 'Yes. Pay any amount up to your full outstanding balance. Partial payments reduce debt and usually improve your health factor.',
      },
      {
        q: 'Is there a fixed payment schedule?',
        a: 'No mandatory monthly schedule. You choose when to repay. If collateral value falls, your health factor can drop and liquidation risk increases even without missed calendar payments.',
      },
      {
        q: 'How do I find my Loan ID?',
        a: 'It is shown after a successful loan request. You can also use the Dashboard Loan Lookup with your collateral ID.',
      },
      {
        q: 'What happens when the loan is fully repaid?',
        a: 'Outstanding debt goes to zero, the loan is closed, and your collateral is no longer tied to that loan.',
      },
    ],
  },
  {
    id: 'liquidation',
    label: 'Liquidation',
    items: [
      {
        q: 'What is liquidation?',
        a: 'If your position becomes undercollateralized, a liquidator can repay part of your debt and receive collateral. This protects lenders from bad debt.',
      },
      {
        q: 'How is the health factor calculated?',
        a: 'The app shows health as a multiple where 1.00 is the danger line. Above 1.00 is healthy; below 1.00 means liquidators may act. It compares collateral value (with a safety threshold) to what you still owe.',
      },
      {
        q: 'How do I avoid liquidation?',
        a: 'Watch the health gauge on the Dashboard. If it nears 1.00, repay some debt or add collateral before prices move against you.',
      },
      {
        q: 'Can someone liquidate my whole loan at once?',
        a: 'Liquidations are partial by default (up to half of outstanding debt per call). Multiple liquidations may be needed if the position stays unhealthy.',
      },
      {
        q: 'Who can liquidate my position?',
        a: 'Anyone can call liquidation when your health factor is below the threshold. The process is permissionless on-chain.',
      },
      {
        q: 'Will I be notified before liquidation?',
        a: 'The Dashboard warns when health is at risk. You can also review notification preferences on the Settings page; email or push alerts depend on how your deployment is configured.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        q: 'Which wallet do I need?',
        a: 'Freighter is the supported browser wallet. It is free and works in Chrome, Firefox, and Brave.',
      },
      {
        q: 'How do I connect my wallet?',
        a: 'Click Connect Wallet. Approve the connection in Freighter. Your public Stellar address then appears in the app.',
      },
      {
        q: 'Is my private key shared with StellarKraal?',
        a: 'No. Freighter signs transactions locally. The app never receives your secret key.',
      },
      {
        q: 'What network should Freighter use?',
        a: 'Match the app environment: Testnet for staging and testing, Mainnet for real funds. The app follows NEXT_PUBLIC_NETWORK in its configuration.',
      },
      {
        q: 'Can I switch wallets?',
        a: 'Disconnect and connect a different Freighter account. Each address has its own collateral and loan history.',
      },
      {
        q: 'Why does my balance look wrong briefly?',
        a: 'Balances come from the Stellar network. After a transaction, wait a few seconds and refresh.',
      },
    ],
  },
  {
    id: 'general',
    label: 'General',
    items: [
      {
        q: 'Which blockchain does StellarKraal use?',
        a: 'Stellar with Soroban smart contracts. Testnet is used for staging; production uses Mainnet.',
      },
      {
        q: 'How do I report a bug?',
        a: 'Open a GitHub issue in the project repository. For security problems, follow the responsible disclosure steps in SECURITY.md.',
      },
      {
        q: 'Is there an API for developers?',
        a: 'Yes. The backend exposes REST endpoints under /api/v1/. Interactive docs are at /api/docs when the API server is running.',
      },
      {
        q: 'Where is the FAQ in the repository?',
        a: 'The same content lives in docs/faq.md and in the app at /help/faq.',
      },
      {
        q: 'What does stroops mean?',
        a: 'The smallest unit of XLM (1 XLM = 10,000,000 stroops). Some technical fields use stroops instead of whole XLM.',
      },
    ],
  },
];

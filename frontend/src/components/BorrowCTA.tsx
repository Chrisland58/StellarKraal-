"use client";

interface Props {
  onStart?: () => void;
}

/**
 * Prominent call-to-action banner for the Borrow page, giving users a clear
 * entry point into the loan request flow.
 */
export default function BorrowCTA({ onStart }: Props) {
  return (
    <div className="mb-8 rounded-2xl bg-gold/10 dark:bg-gold/20 border border-gold/40 dark:border-gold/30 px-6 py-8 text-center">
      <h2 className="text-2xl font-bold text-brown dark:text-cream mb-2">
        Put your livestock to work
      </h2>
      <p className="text-brown/70 dark:text-cream/70 mb-5 max-w-md mx-auto">
        Register collateral and request a loan against its value in just a few steps.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-gold text-brown hover:bg-gold/80 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 dark:focus:ring-offset-[#2A1A08] transition"
      >
        Start Loan Request →
      </button>
    </div>
  );
}

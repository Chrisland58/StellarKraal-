"use client";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

/** A single at-risk loan entry shown in the modal. */
export interface AtRiskLoan {
  id: string;
  /** Health factor in bps, e.g. 11_000 = 1.1x */
  healthFactor: number;
}

interface Props {
  /** List of loans whose health factor is below the warning threshold. */
  atRiskLoans: AtRiskLoan[];
  onDismiss: () => void;
}

export default function LiquidationWarningModal({ atRiskLoans, onDismiss }: Props) {
  if (atRiskLoans.length === 0) return null;

  return (
    <Modal
      open
      onClose={onDismiss}
      title="⚠️ Liquidation Warning"
      size="sm"
      footer={
        <Button variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      }
    >
      <p className="text-sm text-brown-600 mb-4">
        {atRiskLoans.length === 1
          ? "One of your loans has a critically low health factor."
          : `${atRiskLoans.length} of your loans have critically low health factors.`}{" "}
        If the health factor falls below <strong>1.0x</strong>, your collateral may be liquidated.
      </p>

      <ul className="space-y-3 mb-4" aria-label="At-risk loans">
        {atRiskLoans.map((loan) => (
          <li
            key={loan.id}
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm"
          >
            <span className="text-brown-700 font-medium">
              Loan{" "}
              <Link
                href={`/loans/${loan.id}`}
                className="text-gold-600 hover:underline font-semibold"
              >
                #{loan.id}
              </Link>
            </span>
            <span className="font-semibold text-red-700">
              {(loan.healthFactor / 10_000).toFixed(2)}x
            </span>
            <Link
              href={`/dashboard?repay=${loan.id}`}
              className="ml-3 rounded-lg bg-gold px-3 py-1 text-xs font-semibold text-brown hover:bg-gold/80 transition"
              aria-label={`Repay loan ${loan.id} now`}
            >
              Repay Now
            </Link>
          </li>
        ))}
      </ul>

      <ul className="text-sm text-brown-600 space-y-1 list-disc list-inside">
        <li>Repay part of your loan to restore your health factor.</li>
        <li>Add more collateral to increase your buffer.</li>
        <li>Act quickly — liquidation can happen at any time.</li>
      </ul>
    </Modal>
  );
}

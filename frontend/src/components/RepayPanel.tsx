"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signTransaction } from "@stellar/freighter-api";
import { submitSignedXdr } from "@/lib/stellarUtils";
import SuccessOverlay from "@/components/SuccessOverlay";

interface Props {
  walletAddress: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RepayPanel({ walletAddress }: Props) {
  const router = useRouter();
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function repay() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/loan/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrower: walletAddress,
          loan_id: parseInt(loanId),
          amount: parseInt(amount),
        }),
      });
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || "TESTNET",
      });
      await submitSignedXdr(signedTxXdr);
      setShowSuccess(true);
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setShowSuccess(false);
    /* Refresh dashboard data by navigating to same page */
    router.refresh();
  }

  return (
    <>
      {showSuccess && (
        <SuccessOverlay
          title="Repayment Successful!"
          message={`Loan #${loanId} — your payment has been submitted to the Stellar network.`}
          onDismiss={handleDismiss}
        />
      )}

      <div className="bg-white rounded-2xl p-6 shadow mb-4">
        <h2 className="text-xl font-semibold text-brown mb-3">Repay Loan</h2>
        <div className="space-y-3">
          <input
            className="w-full border border-brown/30 rounded-lg px-3 py-2"
            placeholder="Loan ID"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            type="number"
          />
          <input
            className="w-full border border-brown/30 rounded-lg px-3 py-2"
            placeholder="Amount (stroops)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
          />
          <button
            onClick={repay}
            disabled={loading}
            className="w-full bg-gold text-brown py-2.5 rounded-xl font-semibold hover:bg-gold/80 transition disabled:opacity-50"
          >
            {loading ? "Processing…" : "Repay"}
          </button>
        </div>
        {status && <p className="text-sm mt-2">{status}</p>}
      </div>
    </>
  );
}

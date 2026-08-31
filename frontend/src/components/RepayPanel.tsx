"use client";
import { useState } from "react";
import { signTransaction } from "@/lib/freighterClient";
import { submitSignedXdr } from "@/lib/stellarUtils";
import { invalidateLoans } from "@/lib/api";
import Tooltip from "@/components/Tooltip";
import { colors } from "@/lib/design-tokens";
import Card from "@/components/Card";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/toast";
import { useNetworkMismatch } from "@/hooks/useNetworkMismatch";

interface Props {
  walletAddress: string;
  /** Pre-fill the loan ID field (e.g. from the calculator panel) */
  initialLoanId?: string;
  /** Pre-fill the amount field (stroops) */
  initialAmount?: string;
}

interface OutstandingBalance {
  outstanding: number; // stroops
  principal: number; // stroops
}

interface RepaymentPreview {
  remaining_balance: number;
  breakdown: {
    principal: number;
    interest: number;
    fees: number;
    remaining_balance: number;
  };
  fully_repaid: boolean;
  projected_health_factor_bps: number | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const inputCls =
  "w-full border border-brown/30 dark:border-gold/40 rounded-lg px-3 py-2 bg-white dark:bg-[#2A1A08] text-brown dark:text-cream placeholder:text-brown/40 dark:placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-[#F5D060]";

import { useEffect, useRef } from "react";

export default function RepayPanel({ walletAddress }: Props) {
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const toast = useToast();
  const networkMismatch = useNetworkMismatch(walletAddress);
  const mainButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main button is not intersecting (out of view)
        setIsStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (mainButtonRef.current) {
      observer.observe(mainButtonRef.current);
    }

    return () => observer.disconnect();
  }, []);

  async function repay() {
    setLoading(true);
    setStatusMsg(null);
    setOptimisticMsg('⏳ Repayment recorded — awaiting confirmation…');
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const res = await fetch(`${API}/api/loan/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          borrower: walletAddress,
          loan_id: parseInt(loanId, 10),
          amount: parseInt(amount, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Repayment failed');
      }
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || 'TESTNET',
      });
      await submitSignedXdr(signedTxXdr);
      // Loan state changed — drop cached loan lists so they revalidate.
      invalidateLoans();
      toast.success("Repayment submitted successfully!");
      setLoanId("");
      setAmount("");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function scrollToForm() {
    mainButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <>
      <Card
        className="mb-4"
        header={<h2 className={`text-xl font-semibold ${colors.text.primary}`}>Repay Loan</h2>}
      >
        <div className="space-y-3 pb-4">
          <input
            className={`w-full ${colors.form.input} rounded-lg px-3 py-2 ${colors.text.primary} ${colors.form.placeholder}`}
            placeholder="Loan ID"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            type="number"
          />
          <input
            className={`w-full ${colors.form.input} rounded-lg px-3 py-2 ${colors.text.primary} ${colors.form.placeholder}`}
            placeholder="Amount (stroops)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
          />
          <Tooltip hint="R — Repay loan">
            <button
              ref={mainButtonRef}
              onClick={repay}
              disabled={loading || networkMismatch}
              className={`w-full ${colors.secondary.bg} ${colors.secondary.text} py-2.5 rounded-xl font-semibold ${colors.secondary.hover} transition ${colors.interactive.disabled} ${colors.interactive.focus} flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Spinner />
                  Processing…
                </>
              ) : "Repay"}
            </button>
          </Tooltip>
        </div>
      </Card>

      {/* Sticky CTA for Mobile */}
      <div 
        className={`sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1A1005] border-t border-brown/10 dark:border-gold/20 shadow-2xl z-50 transition-opacity duration-150 ${isStickyVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={scrollToForm}
          disabled={loading || networkMismatch}
          className="w-full bg-gold text-brown py-3 rounded-xl font-bold shadow-md active:scale-[0.98] transition-transform"
        >
          {loading ? "Processing…" : "Repay Loan"}
        </button>
      </div>
    </>
  );
}

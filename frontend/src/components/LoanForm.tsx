"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signTransaction } from "@stellar/freighter-api";
import { submitSignedXdr } from "@/lib/stellarUtils";
import SuccessOverlay from "@/components/SuccessOverlay";
import AdvancedOptions, {
  AdvancedOptionValues,
  AdvancedOptionsProvider,
} from "@/components/AdvancedOptions";

interface Props {
  walletAddress: string;
}

const ANIMAL_TYPES = ["cattle", "goat", "sheep"];
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* Inner form — wrapped by AdvancedOptionsProvider below */
function LoanFormInner({ walletAddress }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"collateral" | "loan">("collateral");
  const [animalType, setAnimalType] = useState("cattle");
  const [count, setCount] = useState("");
  const [appraisedValue, setAppraisedValue] = useState("");
  const [collateralId, setCollateralId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [advancedValues, setAdvancedValues] = useState<AdvancedOptionValues>({
    interestRateBps: "",
    extensionDays: "",
    minRepaymentPct: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* Success overlay state */
  const [successOverlay, setSuccessOverlay] = useState<{
    title: string;
    message: string;
    redirect: string;
  } | null>(null);

  async function registerCollateral() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/collateral/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: walletAddress,
          animal_type: animalType,
          count: parseInt(count),
          appraised_value: parseInt(appraisedValue),
        }),
      });
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || "TESTNET",
      });
      const result = await submitSignedXdr(signedTxXdr);
      setCollateralId(String(result));
      setSuccessOverlay({
        title: "Collateral Registered!",
        message: `Collateral ID: ${result} — ready to request a loan.`,
        redirect: "",
      });
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function requestLoan() {
    setLoading(true);
    setStatus(null);
    try {
      const body: Record<string, unknown> = {
        borrower: walletAddress,
        collateral_id: parseInt(collateralId),
        amount: parseInt(loanAmount),
      };

      /* Attach optional advanced fields when provided */
      if (advancedValues.interestRateBps)
        body.interest_rate_bps = parseInt(advancedValues.interestRateBps);
      if (advancedValues.extensionDays)
        body.extension_days = parseInt(advancedValues.extensionDays);
      if (advancedValues.minRepaymentPct)
        body.min_repayment_pct = parseInt(advancedValues.minRepaymentPct);

      const res = await fetch(`${API}/api/loan/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || "TESTNET",
      });
      const result = await submitSignedXdr(signedTxXdr);
      setSuccessOverlay({
        title: "Loan Disbursed!",
        message: `Loan ID: ${result} — check your dashboard for details.`,
        redirect: "/dashboard",
      });
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayDismiss() {
    const redirect = successOverlay?.redirect;
    setSuccessOverlay(null);
    if (redirect) {
      router.push(redirect);
    } else {
      if (step === "collateral") setStep("loan");
    }
  }

  return (
    <>
      {successOverlay && (
        <SuccessOverlay
          title={successOverlay.title}
          message={successOverlay.message}
          onDismiss={handleOverlayDismiss}
        />
      )}

      <div className="bg-white rounded-2xl p-6 shadow mt-6 space-y-4">
        {step === "collateral" ? (
          <>
            <h2 className="text-xl font-semibold text-brown">
              1. Register Collateral
            </h2>
            <select
              className="w-full border border-brown/30 rounded-lg px-3 py-2"
              value={animalType}
              onChange={(e) => setAnimalType(e.target.value)}
            >
              {ANIMAL_TYPES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <input
              className="w-full border border-brown/30 rounded-lg px-3 py-2"
              placeholder="Count"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              type="number"
            />
            <input
              className="w-full border border-brown/30 rounded-lg px-3 py-2"
              placeholder="Appraised value (stroops)"
              value={appraisedValue}
              onChange={(e) => setAppraisedValue(e.target.value)}
              type="number"
            />
            <button
              onClick={registerCollateral}
              disabled={loading}
              className="w-full bg-brown text-cream py-2.5 rounded-xl font-semibold hover:bg-brown/80 transition disabled:opacity-50"
            >
              {loading ? "Processing…" : "Register & Continue"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-brown">2. Request Loan</h2>
            <input
              className="w-full border border-brown/30 rounded-lg px-3 py-2"
              placeholder="Collateral ID"
              value={collateralId}
              onChange={(e) => setCollateralId(e.target.value)}
              type="number"
            />
            <input
              className="w-full border border-brown/30 rounded-lg px-3 py-2"
              placeholder="Loan amount (stroops)"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              type="number"
            />

            {/* ── Progressive disclosure — Issue #1100 ── */}
            <AdvancedOptions onChange={setAdvancedValues} />

            <button
              onClick={requestLoan}
              disabled={loading}
              className="w-full bg-gold text-brown py-2.5 rounded-xl font-semibold hover:bg-gold/80 transition disabled:opacity-50"
            >
              {loading ? "Processing…" : "Request Loan"}
            </button>
          </>
        )}
        {status && <p className="text-sm mt-2">{status}</p>}
      </div>
    </>
  );
}

/* Wrap with the provider so advanced options state persists across wizard steps */
export default function LoanForm({ walletAddress }: Props) {
  return (
    <AdvancedOptionsProvider>
      <LoanFormInner walletAddress={walletAddress} />
    </AdvancedOptionsProvider>
  );
}

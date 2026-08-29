"use client";
import { useState, useEffect, Suspense } from "react";
import WalletConnect from "@/components/WalletConnect";
import CollateralCard from "@/components/CollateralCard";
import RepayPanel from "@/components/RepayPanel";
import HealthGauge from "@/components/HealthGauge";
import DataTable, { ColumnDef } from "@/components/DataTable";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* ─── Loan row type ─────────────────────────────────────────── */
interface LoanRow extends Record<string, unknown> {
  id: number;
  borrower: string;
  amount: number;
  status: string;
  health_factor: number;
  created_at: string;
}

const LOAN_COLUMNS: ColumnDef<LoanRow>[] = [
  { key: "id", label: "Loan ID", sortable: true },
  {
    key: "borrower",
    label: "Borrower",
    sortable: true,
    render: (v) => (
      <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span>
    ),
  },
  {
    key: "amount",
    label: "Amount (stroops)",
    sortable: true,
    render: (v) => Number(v).toLocaleString(),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (v) => {
      const s = String(v);
      const colour =
        s === "active"
          ? "bg-gold/20 text-brown"
          : s === "repaid"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-700";
      return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colour}`}>
          {s}
        </span>
      );
    },
  },
  {
    key: "health_factor",
    label: "Health",
    sortable: true,
    render: (v) => {
      const n = Number(v);
      return (
        <span className={n < 1.2 ? "text-red-600 font-semibold" : "text-brown"}>
          {n.toFixed(2)}
        </span>
      );
    },
  },
  { key: "created_at", label: "Created", sortable: true },
];

/* ─── Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loanId, setLoanId] = useState("");
  const [healthFactor, setHealthFactor] = useState<number | null>(null);
  const [loans, setLoans] = useState<LoanRow[]>([]);

  async function fetchHealth() {
    if (!loanId) return;
    const res = await fetch(`${API}/api/health/${loanId}`);
    const data = await res.json();
    setHealthFactor(Number(data.health_factor ?? 0));
  }

  /* Fetch all loans for the connected wallet */
  useEffect(() => {
    if (!wallet) return;
    fetch(`${API}/api/loan?borrower=${encodeURIComponent(wallet)}`)
      .then((r) => r.json())
      .then((rows: LoanRow[]) => {
        if (Array.isArray(rows)) setLoans(rows);
      })
      .catch(() => {
        /* API may not have this endpoint yet — show empty table */
      });
  }, [wallet]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-brown mb-6">Dashboard</h1>
      <WalletConnect onConnect={setWallet} />
      {wallet && (
        <>
          <CollateralCard walletAddress={wallet} />
          <RepayPanel walletAddress={wallet} />

          {/* ── Loan history table ── */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-brown mb-3">Loan History</h2>
            {/* DataTable requires useSearchParams inside a Suspense boundary */}
            <Suspense fallback={<p className="text-brown/50 text-sm">Loading…</p>}>
              <DataTable<LoanRow>
                columns={LOAN_COLUMNS}
                data={loans}
                rowKey={(row) => String(row.id)}
                caption="Loan history table"
                emptyMessage="No loans found for this wallet."
              />
            </Suspense>
          </div>

          {/* ── Health factor checker ── */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow">
            <h2 className="text-xl font-semibold text-brown mb-3">Health Factor</h2>
            <div className="flex gap-2 items-center">
              <input
                className="border border-brown/30 rounded-lg px-3 py-2 flex-1"
                placeholder="Loan ID"
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
              />
              <button
                onClick={fetchHealth}
                className="bg-gold text-brown font-semibold px-4 py-2 rounded-lg hover:bg-gold/80 transition"
              >
                Check
              </button>
            </div>
            {healthFactor !== null && <HealthGauge value={healthFactor} />}
          </div>
        </>
      )}
    </main>
  );
}

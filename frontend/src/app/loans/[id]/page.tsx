"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import DetailSkeleton from "@/components/DetailSkeleton";

interface LoanRecord {
  id: string;
  borrower: string;
  collateral_id: string;
  amount: number;
  status: string;
  createdAt: string;
}

type ErrorType = "404" | "network" | null;

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loan, setLoan] = useState<LoanRecord | null>(null);
  const [error, setError] = useState<ErrorType>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchLoan = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/loans/${id}`);
      if (res.status === 404) {
        setError("404");
        setLoan(null);
      } else if (!res.ok) {
        setError("network");
        setLoan(null);
      } else {
        const data = await res.json();
        setLoan(data.loan ?? data);
        setError(null);
      }
    } catch {
      setError("network");
      setLoan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error === "404") {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/loans" className="text-brown/60 hover:text-brown text-sm mb-6 inline-block">
          ← Back to Loans
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-6 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">📄</p>
          <h1 className="text-2xl font-bold text-brown mb-2">Loan Not Found</h1>
          <p className="text-brown/60 mb-6">No loan record exists for ID <code className="bg-brown/10 px-1 rounded">{id}</code>.</p>
          <Link href="/loans" className="inline-block bg-brown text-cream px-5 py-2 rounded-xl font-semibold hover:bg-brown/80 transition focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2">
            ← Back to Loans
          </Link>
        </div>
      </main>
    );
  }

  if (error === "network") {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <ErrorState message="Could not load loan – check your connection" onRetry={fetchLoan} />
      </main>
    );
  }

  if (!loan) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-brown/60">No data available</p>
      </main>
    );
  }

  async function copyId() {
    if (!loan.id) return;
    try {
      await navigator.clipboard.writeText(loan.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/loans" className="text-brown/60 hover:text-brown text-sm mb-6 inline-block">
        ← Back to Loans
      </Link>

      <div className="bg-white rounded-2xl p-6 shadow mb-6">
        <h1 className="text-2xl font-bold text-brown mb-4">Loan #{loan.id}</h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-brown/50 text-sm">Loan ID</span>
          <button
            onClick={copyId}
            aria-label={copied ? "Loan ID copied" : "Copy loan ID"}
            title={copied ? "Copied!" : "Copy ID"}
            className="shrink-0 text-brown/50 hover:text-brown transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brown rounded"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-brown/50">Borrower</dt>
          <dd className="font-medium text-brown truncate" title={loan.borrower}>{loan.borrower.slice(0, 8)}…{loan.borrower.slice(-4)}</dd>
          <dt className="text-brown/50">Collateral ID</dt>
          <dd className="font-medium text-brown">{loan.collateral_id}</dd>
          <dt className="text-brown/50">Amount</dt>
          <dd className="font-medium text-brown">{(loan.amount / 1e7).toFixed(2)} XLM</dd>
          <dt className="text-brown/50">Status</dt>
          <dd className="font-medium text-brown capitalize">{loan.status}</dd>
          <dt className="text-brown/50">Created</dt>
          <dd className="font-medium text-brown">{new Date(loan.createdAt).toLocaleDateString()}</dd>
        </dl>
      </div>
    </main>
  );
}

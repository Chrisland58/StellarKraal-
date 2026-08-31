"use client";
import { useState } from "react";
import Link from "next/link";
import { colors } from "@/lib/design-tokens";
import Card from "@/components/Card";
import Spinner from "@/components/Spinner";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { useToast } from "@/components/toast";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Props {
  walletAddress: string;
  /** When provided the entire card becomes a Next.js Link to /dashboard/collateral/[id]. */
  id?: string;
}

// walletAddress is accepted for API consistency but lookup uses a user-entered loan ID
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CollateralCard({ id, walletAddress: _walletAddress }: Props) {
  const toast = useToast();
  const [collateralId, setCollateralId] = useState('');
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetchWithRetry(`${API}/api/loan/${collateralId}`, {
        toast: {
          onRetry: (attempt) => toast.warning(`Retrying… (attempt ${attempt + 1})`),
          onError: (message) => toast.error(message),
        },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch loan data');
    } finally {
      setLoading(false);
    }
  }

  const cardContent = (
    <Card
      className={[
        "mb-4",
        // Hover state: subtle lift with shadow and border brightening
        "transition-all duration-200 ease-in-out",
        "hover:shadow-lg hover:-translate-y-0.5",
        // Pressed / active state: slight push-down
        "active:scale-[0.99] active:shadow-md active:translate-y-0",
        // Keyboard-focus ring using design token colours
        "focus-within:ring-2 focus-within:ring-gold/50 focus-within:ring-offset-2",
        // Dark-mode hover tint
        "dark:hover:border-brown-500",
        // Pointer cursor when the card is a link
        id ? "cursor-pointer" : "",
      ].join(" ")}
      header={<h2 className={`text-xl font-semibold ${colors.text.primary}`}>Loan Lookup</h2>}
    >
      <div className="flex gap-2">
        <label htmlFor="lookup-loan-id" className="sr-only">
          Loan ID
        </label>
        <input
          id="lookup-loan-id"
          className={`${colors.form.input} rounded-lg px-3 py-2 flex-1 min-w-0 ${colors.text.primary} ${colors.form.placeholder}`}
          placeholder="Loan ID"
          value={collateralId}
          onChange={(e) => setCollateralId(e.target.value)}
          // Prevent the link navigation when typing inside the card
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void lookup();
          }}
          disabled={loading}
          className={`${colors.primary.bg} ${colors.primary.text} px-4 py-2 rounded-lg ${colors.primary.hover} transition ${colors.interactive.disabled} ${colors.interactive.focus} flex items-center gap-2`}
        >
          {loading ? (
            <>
              <Spinner />
              <span>Fetching…</span>
            </>
          ) : (
            'Fetch'
          )}
        </button>
      </div>
      {collateralId && (
        <Link
          href={`/collateral/${collateralId}`}
          className="mt-3 inline-block text-sm text-gold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View collateral detail →
        </Link>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {data && (
        <pre
          className={`mt-4 ${colors.background.secondary} rounded-lg p-3 text-xs overflow-auto ${colors.text.primary}`}
        >
          {JSON.stringify(data as Record<string, unknown>, null, 2)}
        </pre>
      )}
    </Card>
  );

  if (id) {
    return (
      <Link
        href={`/dashboard/collateral/${id}`}
        className={[
          "block rounded-2xl",
          // Pointer cursor
          "cursor-pointer",
          // Visible keyboard focus ring
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
        ].join(" ")}
        aria-label={`View collateral ${id}`}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

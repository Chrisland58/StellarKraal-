import type { Metadata } from "next";
import Link from "next/link";

const RETURN_TIME = process.env.NEXT_PUBLIC_MAINTENANCE_RETURN_TIME || "We&apos;ll be back shortly";
const STATUS_MESSAGE = process.env.NEXT_PUBLIC_MAINTENANCE_STATUS_MESSAGE || "StellarKraal is currently undergoing scheduled maintenance.";
const STATUS_PAGE_URL = process.env.NEXT_PUBLIC_STATUS_PAGE_URL || "https://uptime.stellarkraal.io";

export const metadata: Metadata = {
  title: "Maintenance — StellarKraal",
  description: STATUS_MESSAGE,
};


export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <div aria-hidden="true" className="mb-8">
        <svg
          width="140"
          height="140"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Maintenance illustration"
        >
          <circle cx="60" cy="60" r="56" fill="#FDF6EC" stroke="#D4A017" strokeWidth="3" />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="48">
            🔧
          </text>
          <text x="50%" y="72%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="#5D3C15" fontWeight="600">
            back soon
          </text>
        </svg>
      </div>

      <h1 className="text-4xl font-bold text-brown mb-3">Under Maintenance</h1>
      <p className="text-brown/60 max-w-sm mb-2">{STATUS_MESSAGE}</p>
      <p className="text-sm text-brown font-semibold mb-8">{RETURN_TIME}</p>

      <nav aria-label="Maintenance actions" className="flex flex-col sm:flex-row gap-3">
        <Link
          href={STATUS_PAGE_URL}
          className="bg-brown text-cream font-semibold px-6 py-3 rounded-xl hover:bg-brown/80 transition focus:outline-none focus:ring-2 focus:ring-gold"
          target="_blank"
          rel="noopener noreferrer"
        >
          Status Page
        </Link>
        <Link
          href="/"
          className="border border-brown/30 text-brown font-semibold px-6 py-3 rounded-xl hover:bg-brown/5 transition focus:outline-none focus:ring-2 focus:ring-gold"
        >
          Go Home
        </Link>
      </nav>

      <p className="text-xs text-brown/40 mt-8">
        If you need urgent assistance, contact{" "}
        <a
          href="mailto:support@stellarkraal.io"
          className="underline hover:text-brown transition"
        >
          support@stellarkraal.io
        </a>
      </p>
    </main>
  );
}

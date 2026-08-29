import type { Metadata } from "next";
import LoansListClient from "./LoansListClient";

export const metadata: Metadata = {
  title: "Loans — StellarKraal",
  description: "View and manage your livestock-backed micro-loans on the Stellar network.",
  alternates: { canonical: "https://stellarkraal.io/loans" },
  openGraph: {
    title: "Loans — StellarKraal",
    description: "View and manage your livestock-backed micro-loans on the Stellar network.",
    url: "https://stellarkraal.io/loans",
    images: [{ url: "https://stellarkraal.io/og-banner.png" }],
  },
};

export default function LoansPage() {
  return <LoansListClient />;
}

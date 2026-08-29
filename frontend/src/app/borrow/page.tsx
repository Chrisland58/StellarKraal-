import type { Metadata } from "next";
import BorrowClient from "./BorrowClient";

export const metadata: Metadata = {
  title: "Borrow — StellarKraal",
  description: "Register livestock collateral and request a micro-loan on the Stellar network.",
  alternates: { canonical: "https://stellarkraal.io/borrow" },
  openGraph: {
    title: "Borrow — StellarKraal",
    description: "Register livestock collateral and request a micro-loan on the Stellar network.",
    url: "https://stellarkraal.io/borrow",
    images: [{ url: "https://stellarkraal.io/og-banner.png" }],
  },
};

export default function BorrowPage() {
  return <BorrowClient />;
}

import type { Metadata } from "next";
import CollateralListClient from "./CollateralListClient";

export const metadata: Metadata = {
  title: "Collateral — StellarKraal",
  description: "Browse and manage your livestock collateral registered on the Stellar network.",
  alternates: { canonical: "https://stellarkraal.io/collateral" },
  openGraph: {
    title: "Collateral — StellarKraal",
    description: "Browse and manage your livestock collateral registered on the Stellar network.",
    url: "https://stellarkraal.io/collateral",
    images: [{ url: "https://stellarkraal.io/og-banner.png" }],
  },
};

export default function CollateralPage() {
  return <CollateralListClient />;
}

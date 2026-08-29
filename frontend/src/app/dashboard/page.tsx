import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — StellarKraal",
  description: "Manage your livestock collateral, loans, and health factor on StellarKraal.",
  alternates: { canonical: "https://stellarkraal.io/dashboard" },
  openGraph: {
    title: "Dashboard — StellarKraal",
    description: "Manage your livestock collateral, loans, and health factor on StellarKraal.",
    url: "https://stellarkraal.io/dashboard",
    images: [{ url: "https://stellarkraal.io/og-banner.png" }],
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}

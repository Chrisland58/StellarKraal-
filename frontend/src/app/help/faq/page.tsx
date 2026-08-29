import type { Metadata } from "next";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
  title: "FAQ — StellarKraal",
  description: "Frequently asked questions about livestock-backed micro-lending on StellarKraal.",
  alternates: { canonical: "https://stellarkraal.io/help/faq" },
  openGraph: {
    title: "FAQ — StellarKraal",
    description: "Frequently asked questions about livestock-backed micro-lending on StellarKraal.",
    url: "https://stellarkraal.io/help/faq",
    images: [{ url: "https://stellarkraal.io/og-banner.png" }],
  },
};

export default function FaqPage() {
  return <FaqClient />;
}

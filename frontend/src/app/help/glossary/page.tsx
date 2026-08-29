import type { Metadata } from "next";
import React from "react";
import { glossaryArray } from "@/lib/glossary";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Glossary — StellarKraal",
  description: "Definitions of financial and protocol terms used throughout StellarKraal.",
  alternates: { canonical: "https://stellarkraal.io/help/glossary" },
  openGraph: {
    title: "Glossary — StellarKraal",
    description: "Definitions of financial and protocol terms used throughout StellarKraal.",
    url: "https://stellarkraal.io/help/glossary",
    images: [{ url: "https://stellarkraal.io/og-banner.png" }],
  },
};

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-sand-light text-brown-dark font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-brown-dark font-serif">Glossary</h1>
        <p className="mb-4 text-lg text-brown-light">
          Definitions of financial and protocol terms used throughout StellarKraal.
        </p>
        <p className="mb-8 text-sm text-brown-light">
          View the full glossary with cross-references at{" "}
          <a href="https://github.com/oraimoitel/StellarKraal-/blob/main/docs/glossary.md" className="underline hover:text-brown-dark">
            docs/glossary.md
          </a>.
        </p>
        
        <div className="space-y-6">
          {glossaryArray.map(({ id, term, definition }) => (
            <div key={id} className="bg-white p-6 rounded-2xl shadow-sm border border-brown/10" id={id}>
              <h2 className="text-xl font-semibold mb-2">{term}</h2>
              <p className="text-brown-light">{definition}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

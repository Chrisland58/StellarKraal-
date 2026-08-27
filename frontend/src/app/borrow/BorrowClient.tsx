"use client";
import { useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import CollateralRegistrationForm from "@/components/CollateralRegistrationForm";
import LoanForm from "@/components/LoanForm";
import PageTransition from "@/components/PageTransition";
import { Hero } from "@/components/Hero";

export default function BorrowClient() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [collateralId, setCollateralId] = useState<string | null>(null);

  return (
    <PageTransition>
      <Hero className="py-10">
        <main className="max-w-lg mx-auto px-4">
          <h1 className="text-3xl font-bold text-brown mb-6">Borrow</h1>
          <WalletConnect onConnect={setWallet} />
          {wallet && (
            <CollateralRegistrationForm
              walletAddress={wallet}
              onSuccess={(id) => setCollateralId(id)}
            />
          )}
          {collateralId && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Collateral registered with ID: {collateralId}
              </p>
            </div>
          )}
          {wallet && collateralId && (
            <LoanForm walletAddress={wallet} initialCollateralId={collateralId} />
          )}
        </main>
      </Hero>
    </PageTransition>
  );
}

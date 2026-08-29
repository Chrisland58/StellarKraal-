'use client';

import MoneyAmount from '@/components/MoneyAmount';

interface Collateral {
  appraised_value: number;
}

interface Props {
  collaterals: Collateral[];
}

export default function CollateralSummary({ collaterals }: Props) {
  const totalValue = collaterals.reduce((sum, c) => sum + c.appraised_value, 0);
  // Assuming 1 XLM ≈ $0.12 (placeholder, should be fetched from oracle)
  const usdValue = (totalValue / 1e7) * 0.12;
  const availableCapacityStroops = totalValue * 0.5;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-brown/5 to-brown/10 dark:from-brown-800 dark:to-brown-900 rounded-2xl p-6 border border-brown/20 dark:border-gold/20">
        <p className="text-brown/60 dark:text-cream/60 text-sm font-medium mb-2">
          Total Collateral Value
        </p>
        <p className="text-2xl font-bold text-brown dark:text-cream-50 mb-1">
          <MoneyAmount value={totalValue} fromStroops />
        </p>
        <p className="text-sm text-brown/50 dark:text-cream/50">
          <MoneyAmount value={usdValue} currency="USD" interactive={false} />
        </p>
      </div>

      <div className="bg-gradient-to-br from-gold/5 to-gold/10 dark:from-brown-800 dark:to-brown-900 rounded-2xl p-6 border border-gold/20 dark:border-gold/30">
        <p className="text-brown/60 dark:text-cream/60 text-sm font-medium mb-2">
          Available Borrowing Capacity
        </p>
        <p className="text-2xl font-bold text-brown dark:text-cream-50 mb-1">
          <MoneyAmount value={availableCapacityStroops} fromStroops />
        </p>
        <p className="text-sm text-brown/50 dark:text-cream/50">50% of collateral value</p>
      </div>

      <div className="bg-gradient-to-br from-cream to-cream/50 dark:from-brown-800 dark:to-brown-900 rounded-2xl p-6 border border-brown/10 dark:border-gold/20">
        <p className="text-brown/60 dark:text-cream/60 text-sm font-medium mb-2">
          Assets Registered
        </p>
        <p className="text-2xl font-bold text-brown dark:text-cream-50">{collaterals.length}</p>
        <p className="text-sm text-brown/50 dark:text-cream/50">livestock items</p>
      </div>
    </div>
  );
}

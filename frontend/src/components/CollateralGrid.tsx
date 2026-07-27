'use client';
import Card from '@/components/Card';
import SkeletonCollateralCard from '@/components/SkeletonCollateralCard';
import EmptyState from '@/components/EmptyState';
import { healthColor } from '@/lib/design-tokens';

interface Collateral {
  id: string;
  animal_type: string;
  count: number;
  appraised_value: number;
  createdAt: string;
  health_factor_bps?: number | null; // Health factor in basis points (10000 = 1.0x)
}

interface Props {
  collaterals: Collateral[];
  loading: boolean;
  onCardClick: (id: string) => void;
  onAddCollateral?: () => void;
}

const ANIMAL_ICONS: Record<string, string> = {
  cattle: '🐄',
  goat: '🐐',
  sheep: '🐑',
};

export default function CollateralGrid({
  collaterals,
  loading,
  onCardClick,
  onAddCollateral,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCollateralCard key={i} />
        ))}
      </div>
    );
  }

  if (collaterals.length === 0) {
    return (
      <EmptyState
        icon="🐄"
        heading="No Collateral Registered"
        message="Register your livestock as collateral to unlock loans. Start by adding your first animal."
        ctaLabel="Register Collateral"
        onCta={onAddCollateral}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collaterals.map((collateral) => {
        const xlmValue = (collateral.appraised_value / 1e7).toFixed(2);
        const usdValue = (parseFloat(xlmValue) * 0.12).toFixed(2);
        const icon = ANIMAL_ICONS[collateral.animal_type] || '🐾';
        const healthFactorBps = collateral.health_factor_bps;
        const showHealthIndicator = healthFactorBps !== undefined && healthFactorBps !== null;
        const healthColorHex = showHealthIndicator ? healthColor(healthFactorBps) : undefined;

        return (
          <button
            key={collateral.id}
            onClick={() => onCardClick(collateral.id)}
            className="text-left hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-brown-600 focus:ring-offset-2 rounded-2xl"
          >
            <Card
              variant="default"
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{icon}</span>
                    {showHealthIndicator && (
                      <div
                        className="relative group"
                        role="img"
                        aria-label={`Loan health: ${(healthFactorBps / 10000).toFixed(2)}`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: healthColorHex }}
                          aria-hidden="true"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-brown-900 text-cream-50 text-xs rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          Loan health: {(healthFactorBps / 10000).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="bg-brown-100 dark:bg-brown-700 text-brown-700 dark:text-brown-200 text-xs font-semibold px-3 py-1 rounded-full">
                    {collateral.count}x
                  </span>
                </div>
              }
              footer={
                <p className="text-xs text-brown-500 font-mono">ID: {collateral.id.slice(0, 8)}…</p>
              }
            >
              <h3 className="text-lg font-semibold text-brown-700 dark:text-cream-50 mb-3 capitalize">
                {collateral.animal_type}
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-brown-500 mb-0.5">Appraised Value</p>
                  <p className="font-semibold text-brown-700 dark:text-cream-50">{xlmValue} XLM</p>
                  <p className="text-xs text-brown-500">${usdValue} USD</p>
                </div>
                <div>
                  <p className="text-xs text-brown-500 mb-0.5">Registered</p>
                  <p className="text-xs text-brown-600 dark:text-brown-300">
                    {new Date(collateral.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

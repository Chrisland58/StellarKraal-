'use client';
import { useDensity, Density, DENSITY_OPTIONS } from '@/hooks/useDensity';

const LABELS: Record<Density, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
};

const DESCRIPTIONS: Record<Density, string> = {
  compact: 'Reduced padding and smaller font size — fits more data on screen.',
  comfortable: 'Default spacing — balanced readability and density.',
  spacious: 'Increased padding and larger tap targets — ideal for touch devices.',
};

export default function DensityToggle() {
  const { density, setDensity } = useDensity();

  return (
    <div className="bg-white dark:bg-brown-900 rounded-2xl p-6 shadow space-y-4">
      <h2 className="text-xl font-semibold text-brown dark:text-cream-50">Display Density</h2>
      <p className="text-sm text-brown/60 dark:text-cream-200/60">
        Controls the spacing and font size used across all list views and tables.
      </p>

      <fieldset>
        <legend className="sr-only">Display density</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4" role="group">
          {DENSITY_OPTIONS.map((option) => {
            const isSelected = density === option;
            return (
              <label
                key={option}
                className={[
                  'flex-1 cursor-pointer rounded-xl border-2 p-4 transition-all',
                  'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brown-500',
                  isSelected
                    ? 'border-brown-600 bg-cream-100 dark:border-brown-400 dark:bg-brown-800'
                    : 'border-brown-200 bg-white hover:border-brown-400 dark:border-brown-700 dark:bg-brown-900 dark:hover:border-brown-500',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="density"
                  value={option}
                  checked={isSelected}
                  onChange={() => setDensity(option)}
                  className="sr-only"
                  aria-describedby={`density-desc-${option}`}
                />
                <span className="block font-semibold text-sm text-brown-700 dark:text-cream-100">
                  {LABELS[option]}
                </span>
                <span
                  id={`density-desc-${option}`}
                  className="block text-xs text-brown-500 dark:text-cream-200/60 mt-1"
                >
                  {DESCRIPTIONS[option]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

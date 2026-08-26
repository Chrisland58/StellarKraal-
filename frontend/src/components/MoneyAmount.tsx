'use client';

import { useEffect, useState } from 'react';
import {
  formatFiat,
  formatMoneyAriaLabel,
  formatXlm,
  formatXlmFromStroops,
  getBrowserLocale,
} from '@/lib/formatMoney';
import { cn } from '@/lib/utils';

export interface MoneyAmountProps {
  /** Numeric amount. Stroops when `fromStroops` is set and currency is XLM. */
  value: number;
  /** `"XLM"` or an ISO 4217 fiat code such as `"USD"`. */
  currency?: string;
  /** When true (and currency is XLM), `value` is in stroops. */
  fromStroops?: boolean;
  /** Override browser locale (useful in tests). */
  locale?: string;
  /**
   * When true the amount is focusable so keyboard users can land on it.
   * Set false when nested inside another interactive element (button/link).
   */
  interactive?: boolean;
  className?: string;
}

/**
 * Accessible, locale-aware monetary value (#831).
 * Light/dark styles use existing brown/cream tokens (WCAG AA).
 */
export default function MoneyAmount({
  value,
  currency = 'XLM',
  fromStroops = false,
  locale: localeProp,
  interactive = true,
  className = '',
}: MoneyAmountProps) {
  const [locale, setLocale] = useState(localeProp ?? 'en-US');

  useEffect(() => {
    setLocale(localeProp ?? getBrowserLocale());
  }, [localeProp]);

  const isXlm = currency === 'XLM';
  const xlmAmount = isXlm && fromStroops ? Number(value) / 1e7 : value;
  const formatted = isXlm
    ? fromStroops
      ? formatXlmFromStroops(value, locale)
      : formatXlm(value, locale)
    : formatFiat(value, currency, locale);
  const ariaLabel = formatMoneyAriaLabel(isXlm ? xlmAmount : value, currency, locale);

  return (
    <span
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'tabular-nums text-brown-700 dark:text-cream-50',
        interactive &&
          'rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brown-600 focus-visible:ring-offset-2 dark:focus-visible:ring-gold-500 dark:focus-visible:ring-offset-brown-900',
        className
      )}
    >
      {formatted}
    </span>
  );
}

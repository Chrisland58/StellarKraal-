'use client';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useCurrencySettings } from '@/hooks/useCurrencySettings';
import { formatFiat, formatXlm, getBrowserLocale } from '@/lib/formatMoney';
import { useEffect, useState } from 'react';

interface Props {
  /** Amount in XLM (not stroops) */
  xlm: number;
  className?: string;
}

export default function XlmAmount({ xlm, className = '' }: Props) {
  const { currency, enabled } = useCurrencySettings();
  const { convert, isStale, loading } = useCurrencyConversion();
  const [locale, setLocale] = useState('en-US');

  useEffect(() => {
    setLocale(getBrowserLocale());
  }, []);

  const local = enabled ? convert(xlm, currency) : null;

  return (
    <span className={className}>
      {formatXlm(xlm, locale)}
      {enabled && (
        <span className="text-brown/60 dark:text-cream/60 text-sm ml-1">
          {loading && !local ? (
            '…'
          ) : local !== null ? (
            <>
              ({formatFiat(local, currency, locale)})
              {isStale && (
                <span
                  title="Rate may be outdated (>10 min)"
                  className="ml-1 text-amber-500 text-xs"
                >
                  ⚠
                </span>
              )}
            </>
          ) : null}
        </span>
      )}
    </span>
  );
}

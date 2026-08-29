/**
 * Locale-aware money formatting via Intl.NumberFormat (#831).
 *
 * XLM values use at most 7 fractional digits (Stellar stroop precision).
 * Fiat values use an ISO 4217 currency symbol and exactly 2 decimal places.
 * Grouping separators follow the supplied locale (browser locale by default).
 */

const XLM_MAX_FRACTION_DIGITS = 7;
const FIAT_FRACTION_DIGITS = 2;

export function getBrowserLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-US';
}

function resolveLocale(locale?: string): string {
  return locale || getBrowserLocale();
}

function isFiniteNumber(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Format a numeric amount with locale grouping; used for XLM (no currency code). */
export function formatXlmNumber(amount: number, locale?: string): string {
  if (!isFiniteNumber(amount)) return '—';
  return new Intl.NumberFormat(resolveLocale(locale), {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: XLM_MAX_FRACTION_DIGITS,
  }).format(amount);
}

/** Format an XLM amount with locale grouping and an "XLM" suffix. */
export function formatXlm(amount: number, locale?: string): string {
  const formatted = formatXlmNumber(amount, locale);
  return formatted === '—' ? formatted : `${formatted} XLM`;
}

/** Convert stroops (1e-7 XLM) to a locale-formatted XLM string. */
export function formatXlmFromStroops(stroops: number | bigint, locale?: string): string {
  return formatXlm(Number(stroops) / 1e7, locale);
}

/** Format a fiat amount with currency symbol and 2 decimal places. */
export function formatFiat(amount: number, currency = 'USD', locale?: string): string {
  if (!isFiniteNumber(amount)) return '—';
  const resolved = resolveLocale(locale);
  try {
    return new Intl.NumberFormat(resolved, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: FIAT_FRACTION_DIGITS,
      maximumFractionDigits: FIAT_FRACTION_DIGITS,
    }).format(amount);
  } catch {
    const number = new Intl.NumberFormat(resolved, {
      useGrouping: true,
      minimumFractionDigits: FIAT_FRACTION_DIGITS,
      maximumFractionDigits: FIAT_FRACTION_DIGITS,
    }).format(amount);
    return `${currency} ${number}`;
  }
}

/** Spoken form for screen readers (currency name instead of a symbol). */
export function formatMoneyAriaLabel(amount: number, currency: string, locale?: string): string {
  if (!isFiniteNumber(amount)) return 'Amount unavailable';
  const resolved = resolveLocale(locale);
  if (currency === 'XLM') {
    return `${formatXlmNumber(amount, resolved)} lumens`;
  }
  try {
    return new Intl.NumberFormat(resolved, {
      style: 'currency',
      currency,
      currencyDisplay: 'name',
      minimumFractionDigits: FIAT_FRACTION_DIGITS,
      maximumFractionDigits: FIAT_FRACTION_DIGITS,
    }).format(amount);
  } catch {
    return `${formatFiat(amount, currency, resolved)} ${currency}`;
  }
}

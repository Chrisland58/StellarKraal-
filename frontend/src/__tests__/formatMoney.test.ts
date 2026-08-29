import {
  formatFiat,
  formatMoneyAriaLabel,
  formatXlm,
  formatXlmFromStroops,
  formatXlmNumber,
} from '@/lib/formatMoney';

describe('formatXlm', () => {
  it('formats en-US with comma thousands separator and at most 7 fraction digits', () => {
    expect(formatXlm(1234567.12345678, 'en-US')).toBe('1,234,567.1234568 XLM');
  });

  it('formats en-GB with comma thousands separator', () => {
    expect(formatXlm(1234567.12345678, 'en-GB')).toBe('1,234,567.1234568 XLM');
  });

  it('formats de-DE with period thousands separator and comma decimals', () => {
    expect(formatXlm(1234567.12345678, 'de-DE')).toBe('1.234.567,1234568 XLM');
  });

  it('does not pad trailing zeros and caps at 7 decimal places', () => {
    expect(formatXlmNumber(1, 'en-US')).toBe('1');
    expect(formatXlmNumber(1.23, 'en-US')).toBe('1.23');
    const parts = formatXlmNumber(1.12345678, 'en-US').split('.');
    expect(parts[1].length).toBeLessThanOrEqual(7);
  });

  it('formats stroops as XLM', () => {
    expect(formatXlmFromStroops(10_000_000, 'en-US')).toBe('1 XLM');
    expect(formatXlmFromStroops(15_000_000, 'en-US')).toBe('1.5 XLM');
  });

  it('returns an em dash for non-finite values', () => {
    expect(formatXlm(Number.NaN)).toBe('—');
    expect(formatXlm(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatFiat', () => {
  it('formats en-US USD with $ symbol and 2 decimal places', () => {
    expect(formatFiat(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
  });

  it('formats en-GB GBP with £ symbol, grouping, and 2 decimal places', () => {
    expect(formatFiat(1234.5, 'GBP', 'en-GB')).toBe('£1,234.50');
  });

  it('formats de-DE EUR with locale grouping, comma decimals, and currency symbol', () => {
    const result = formatFiat(1234.5, 'EUR', 'de-DE');
    expect(result).toMatch(/1\.234,50/);
    expect(result).toContain('€');
  });

  it('formats en-GB USD with a US$ prefix and 2 decimal places', () => {
    expect(formatFiat(1234.5, 'USD', 'en-GB')).toBe('US$1,234.50');
  });

  it('formats de-DE USD with locale separators and a currency symbol', () => {
    const result = formatFiat(1234.5, 'USD', 'de-DE');
    expect(result).toMatch(/1\.234,50/);
    expect(result).toMatch(/\$/);
  });

  it('returns an em dash for non-finite values', () => {
    expect(formatFiat(Number.NaN, 'USD')).toBe('—');
  });
});

describe('formatMoneyAriaLabel', () => {
  it('uses the word lumens for XLM', () => {
    expect(formatMoneyAriaLabel(12.5, 'XLM', 'en-US')).toBe('12.5 lumens');
  });

  it('uses the currency name for fiat', () => {
    expect(formatMoneyAriaLabel(12.5, 'USD', 'en-US')).toMatch(/12\.50/);
    expect(formatMoneyAriaLabel(12.5, 'USD', 'en-US').toLowerCase()).toMatch(/dollar/);
  });
});

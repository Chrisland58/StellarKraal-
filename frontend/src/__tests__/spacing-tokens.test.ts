/**
 * Tests for the spacing scale defined in design-tokens.ts (#778).
 */

import { spacing } from '@/lib/design-tokens';

describe('spacing design tokens', () => {
  const expectedTokens: Array<[keyof typeof spacing, string]> = [
    ['space1',  'space-1'],
    ['space2',  'space-2'],
    ['space3',  'space-3'],
    ['space4',  'space-4'],
    ['space6',  'space-6'],
    ['space8',  'space-8'],
    ['space12', 'space-12'],
    ['space16', 'space-16'],
  ];

  it('exports the correct number of spacing tokens', () => {
    expect(Object.keys(spacing)).toHaveLength(8);
  });

  it.each(expectedTokens)(
    'spacing.%s equals "%s"',
    (key, expectedValue) => {
      expect(spacing[key]).toBe(expectedValue);
    },
  );

  it('all token values follow the space-N naming convention', () => {
    Object.values(spacing).forEach((value) => {
      expect(value).toMatch(/^space-\d+$/);
    });
  });
});

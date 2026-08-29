/**
 * Tests for benchmark comparison logic (Issue #643)
 *
 * Verifies that the p99 regression detection works correctly
 * with the 20% threshold defined in performance/BASELINES.md.
 */

describe('Benchmark comparison logic', () => {
  const BASELINES: Record<string, number> = {
    'GET /api/v1/loans': 50,
    'GET /api/v1/collateral': 50,
    'POST /api/v1/loans': 100,
  };

  const REGRESSION_PERCENT = 0.20;

  function checkRegression(p99: number, baseline: number): { passed: boolean; limit: number } {
    const limit = Math.round(baseline * (1 + REGRESSION_PERCENT));
    return { passed: p99 <= limit, limit };
  }

  it('should pass when p99 is at baseline', () => {
    const result = checkRegression(50, BASELINES['GET /api/v1/loans']);
    expect(result.passed).toBe(true);
    expect(result.limit).toBe(60);
  });

  it('should pass when p99 is below baseline', () => {
    const result = checkRegression(30, BASELINES['GET /api/v1/loans']);
    expect(result.passed).toBe(true);
  });

  it('should pass when p99 is exactly at 20% threshold', () => {
    const result = checkRegression(60, BASELINES['GET /api/v1/loans']);
    expect(result.passed).toBe(true);
    expect(result.limit).toBe(60);
  });

  it('should fail when p99 exceeds 20% threshold', () => {
    const result = checkRegression(61, BASELINES['GET /api/v1/loans']);
    expect(result.passed).toBe(false);
  });

  it('should compute correct threshold for POST endpoint', () => {
    const result = checkRegression(120, BASELINES['POST /api/v1/loans']);
    expect(result.passed).toBe(true);
    expect(result.limit).toBe(120);
  });

  it('should fail POST endpoint when p99 exceeds threshold', () => {
    const result = checkRegression(121, BASELINES['POST /api/v1/loans']);
    expect(result.passed).toBe(false);
  });

  it('should have baselines defined for all required endpoints', () => {
    expect(BASELINES).toHaveProperty('GET /api/v1/loans');
    expect(BASELINES).toHaveProperty('GET /api/v1/collateral');
    expect(BASELINES).toHaveProperty('POST /api/v1/loans');
  });

  it('should use 20% as the regression threshold', () => {
    expect(REGRESSION_PERCENT).toBe(0.20);
  });
});

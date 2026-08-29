import {
  calcInterestRate,
  calcUtilization,
  accrueSimpleInterest,
  accrueCompoundInterest,
  DEFAULT_MODEL,
  InterestRateModel,
} from "./interestRate";

// Fixed reference timestamp to prevent flakiness
const T0 = new Date("2026-01-01T00:00:00.000Z").getTime();
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

describe("calcInterestRate — default model", () => {
  // ── utilization checkpoints from the documentation ─────────────────────
  it("0% utilization → base rate 200 bps (2%)", () => {
    expect(calcInterestRate(0)).toBe(200);
  });

  it("50% utilization → 450 bps (4.5%)", () => {
    // rate = 200 + floor(500 * 5000 / 10000) = 200 + 250 = 450
    expect(calcInterestRate(5000)).toBe(450);
  });

  it("80% utilization (at kink) → 600 bps (6%)", () => {
    // rate = 200 + floor(500 * 8000 / 10000) = 200 + 400 = 600
    expect(calcInterestRate(8000)).toBe(600);
  });

  it("100% utilization → 1500 bps (15%)", () => {
    // rate = 200 + floor(500*8000/10000) + floor(4500*2000/10000)
    //      = 200 + 400 + 900 = 1500
    expect(calcInterestRate(10000)).toBe(1500);
  });

  // ── formula consistency ────────────────────────────────────────────────
  it("rate at kink matches both branch formulas", () => {
    const { base_rate_bps, slope1_bps, kink_bps } = DEFAULT_MODEL;
    const expected = base_rate_bps + Math.floor((slope1_bps * kink_bps) / 10_000);
    expect(calcInterestRate(kink_bps)).toBe(expected);
  });

  it("rate increases monotonically with utilization", () => {
    const points = [0, 1000, 2000, 4000, 5000, 7000, 8000, 9000, 10000];
    for (let i = 1; i < points.length; i++) {
      expect(calcInterestRate(points[i])).toBeGreaterThanOrEqual(
        calcInterestRate(points[i - 1]),
      );
    }
  });

  it("rate at 0% equals base_rate_bps", () => {
    expect(calcInterestRate(0)).toBe(DEFAULT_MODEL.base_rate_bps);
  });

  it("minimum rate is base_rate_bps (never below)", () => {
    for (let u = 0; u <= 10000; u += 500) {
      expect(calcInterestRate(u)).toBeGreaterThanOrEqual(DEFAULT_MODEL.base_rate_bps);
    }
  });
});

describe("calcInterestRate — custom model", () => {
  const model: InterestRateModel = {
    base_rate_bps: 100,
    slope1_bps: 300,
    slope2_bps: 2000,
    kink_bps: 6000,
  };

  it("applies custom base rate at 0% utilization", () => {
    expect(calcInterestRate(0, model)).toBe(100);
  });

  it("uses slope1 below kink", () => {
    // 200 bps utilization: 100 + floor(300*2000/10000) = 100 + 60 = 160
    expect(calcInterestRate(2000, model)).toBe(160);
  });

  it("uses slope2 above kink", () => {
    // 100% util: 100 + floor(300*6000/10000) + floor(2000*4000/10000)
    //          = 100 + 180 + 800 = 1080
    expect(calcInterestRate(10000, model)).toBe(1080);
  });
});

describe("calcInterestRate — validation", () => {
  it("throws RangeError for utilization < 0", () => {
    expect(() => calcInterestRate(-1)).toThrow(RangeError);
  });

  it("throws RangeError for utilization > 10000", () => {
    expect(() => calcInterestRate(10001)).toThrow(RangeError);
  });

  it("accepts boundary values 0 and 10000 without throwing", () => {
    expect(() => calcInterestRate(0)).not.toThrow();
    expect(() => calcInterestRate(10000)).not.toThrow();
  });
});

describe("calcUtilization", () => {
  it("0 borrowed → 0 bps", () => {
    expect(calcUtilization(0, 1_000_000)).toBe(0);
  });

  it("50% borrowed → 5000 bps", () => {
    expect(calcUtilization(500_000, 1_000_000)).toBe(5000);
  });

  it("80% borrowed → 8000 bps", () => {
    expect(calcUtilization(800_000, 1_000_000)).toBe(8000);
  });

  it("100% borrowed → 10000 bps", () => {
    expect(calcUtilization(1_000_000, 1_000_000)).toBe(10000);
  });

  it("over-borrowed is capped at 10000 bps", () => {
    expect(calcUtilization(2_000_000, 1_000_000)).toBe(10000);
  });

  it("zero liquidity → 0 bps (no division by zero)", () => {
    expect(calcUtilization(1000, 0)).toBe(0);
  });
});

describe("accrueSimpleInterest", () => {
  it("zero elapsed time → zero interest", () => {
    expect(accrueSimpleInterest(1_000_000, 600, 0)).toBe(0);
  });

  it("zero principal → zero interest", () => {
    expect(accrueSimpleInterest(0, 600, MS_PER_YEAR)).toBe(0);
  });

  it("1 full year at 600 bps → ~6% of principal (truncated)", () => {
    // 1_000_000 * 600 / 10_000 = 60_000 (exactly, before floor)
    expect(accrueSimpleInterest(1_000_000, 600, MS_PER_YEAR)).toBe(60_000);
  });

  it("6 months at 600 bps → ~30_000 (half-year, fixed timestamp)", () => {
    const halfYear = MS_PER_YEAR / 2;
    expect(accrueSimpleInterest(1_000_000, 600, halfYear)).toBe(30_000);
  });

  it("uses fixed T0 timestamp — deterministic output", () => {
    const elapsed = T0 + MS_PER_YEAR - T0; // exactly 1 year
    expect(accrueSimpleInterest(500_000, 200, elapsed)).toBe(10_000);
  });

  it("result is always an integer (no fractional stroops)", () => {
    const result = accrueSimpleInterest(123_456, 317, 7 * 24 * 60 * 60 * 1000);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("accrueCompoundInterest", () => {
  it("zero elapsed time → principal unchanged", () => {
    expect(accrueCompoundInterest(1_000_000, 600, 0)).toBe(1_000_000);
  });

  it("zero principal → zero returned", () => {
    expect(accrueCompoundInterest(0, 600, MS_PER_YEAR)).toBe(0);
  });

  it("1 full year at 600 bps exceeds simple interest (compounding premium)", () => {
    const compound = accrueCompoundInterest(1_000_000, 600, MS_PER_YEAR);
    const simple = 1_000_000 + accrueSimpleInterest(1_000_000, 600, MS_PER_YEAR);
    expect(compound).toBeGreaterThan(simple);
  });

  it("short period — compound ≈ simple (within 1 unit tolerance)", () => {
    const elapsed = 24 * 60 * 60 * 1000; // 1 day
    const compound = accrueCompoundInterest(1_000_000, 600, elapsed);
    const simple = accrueSimpleInterest(1_000_000, 600, elapsed);
    // compound - principal ≈ simple for short periods
    expect(Math.abs(compound - 1_000_000 - simple)).toBeLessThanOrEqual(1);
  });

  it("result is always an integer (truncated, not rounded)", () => {
    const result = accrueCompoundInterest(987_654, 450, 30 * 24 * 60 * 60 * 1000);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("compound always >= simple for same inputs (interest-on-interest)", () => {
    const periods = [
      MS_PER_YEAR / 12,
      MS_PER_YEAR / 4,
      MS_PER_YEAR / 2,
      MS_PER_YEAR,
    ];
    for (const elapsed of periods) {
      const compound = accrueCompoundInterest(1_000_000, 600, elapsed);
      const simple = 1_000_000 + accrueSimpleInterest(1_000_000, 600, elapsed);
      expect(compound).toBeGreaterThanOrEqual(simple);
    }
  });
});

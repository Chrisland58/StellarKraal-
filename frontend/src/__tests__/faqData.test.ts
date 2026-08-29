import { FAQ_CATEGORIES } from '@/lib/faqData';

const REQUIRED_CATEGORY_IDS = [
  'eligibility',
  'collateral',
  'loan-limits',
  'interest-rates',
  'repayment',
  'liquidation',
  'account',
  'general',
];

describe('faqData', () => {
  it('defines all borrower FAQ categories', () => {
    const ids = FAQ_CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(REQUIRED_CATEGORY_IDS);
  });

  it('includes at least twenty borrower questions', () => {
    const count = FAQ_CATEGORIES.reduce((n, cat) => n + cat.items.length, 0);
    expect(count).toBeGreaterThanOrEqual(20);
  });

  it('has non-empty questions and answers in every category', () => {
    for (const cat of FAQ_CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.items.length).toBeGreaterThan(0);
      for (const item of cat.items) {
        expect(item.q.trim().length).toBeGreaterThan(0);
        expect(item.a.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('uses unique question text within each category', () => {
    for (const cat of FAQ_CATEGORIES) {
      const questions = cat.items.map((i) => i.q);
      expect(new Set(questions).size).toBe(questions.length);
    }
  });
});

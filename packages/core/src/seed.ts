import { CoastState } from './types';
import { CATEGORIES } from './categories';

export const SEED_STATE: CoastState = {
  schemaVersion: 1,
  onboardingComplete: false,
  profileName: 'Snigdha',
  memberSince: '2026-08-01',
  income: { monthly: 206500, paydayDom: 31 },
  plan: {
    bills: 152000,
    savings: 8500,
    debt: 0,
    discretionary: 46000,
    essentials: 20000,
    lifestyle: 17886,
    joy: 8114,
  },
  categories: CATEGORIES,
  transactions: [],
  payments: [
    { id: 'pmt_rent',      name: 'Rent',      amount: 110000, cadence: 'monthly', billingDay: 1,  categoryId: 'rent' },
    { id: 'pmt_utilities', name: 'Utilities', amount: 22000,  cadence: 'monthly', billingDay: 15, categoryId: 'utilities' },
    { id: 'pmt_insurance', name: 'Insurance', amount: 16000,  cadence: 'monthly', billingDay: 5,  categoryId: 'insurance' },
    { id: 'pmt_phone',     name: 'Phone',     amount: 4000,   cadence: 'monthly', billingDay: 20, categoryId: 'phone' },
  ],
  funds: [],
  leaks: [
    { id: 'leak_streaming', merchant: 'Streaming bundle',     annual: 120000, closed: false },
    { id: 'leak_subs',      merchant: 'Unused subscriptions', annual: 96000,  closed: false },
    { id: 'leak_fees',      merchant: 'Card fees',            annual: 70000,  closed: false },
  ],
  statements: [
    { id: 'stmt_w31', issueNumber: 31, weekStart: '2026-07-27', issuedDate: '2026-08-09', status: 'readyToStamp' },
  ],
};

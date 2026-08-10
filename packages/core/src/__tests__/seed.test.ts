import { SEED_STATE } from '../seed';

describe('SEED_STATE', () => {
  it('plan groups sum to monthly income', () => {
    const p = SEED_STATE.plan;
    expect(p.bills + p.savings + p.debt + p.discretionary).toBe(SEED_STATE.income.monthly);
    expect(SEED_STATE.income.monthly).toBe(206500);
  });
  it('discretionary subpools sum to discretionary', () => {
    const p = SEED_STATE.plan;
    expect(p.essentials + p.lifestyle + p.joy).toBe(p.discretionary);
    expect(p.lifestyle).toBe(17886);
  });
  it('recurring payments sum to bills', () => {
    const total = SEED_STATE.payments.reduce((s: number, p) => s + p.amount, 0);
    expect(total).toBe(152000);
  });
  it('open leaks annualise to £2,860', () => {
    const total = SEED_STATE.leaks.reduce((s: number, l) => s + l.annual, 0);
    expect(total).toBe(286000);
  });
  it('starts pre-onboarding with one ready statement and no transactions', () => {
    expect(SEED_STATE.onboardingComplete).toBe(false);
    expect(SEED_STATE.transactions).toHaveLength(0);
    expect(SEED_STATE.statements[0].status).toBe('readyToStamp');
    expect(SEED_STATE.income.paydayDom).toBe(31);
  });
});

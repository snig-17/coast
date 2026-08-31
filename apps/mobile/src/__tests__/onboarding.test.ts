import { monthlyFromCadence, buildOnboarding, OnboardingInput } from '../store/onboarding';

describe('monthlyFromCadence', () => {
  it('passes monthly through and annualises weekly to a month', () => {
    expect(monthlyFromCadence(120000, 'monthly')).toBe(120000);
    expect(monthlyFromCadence(10000, 'weekly')).toBe(Math.round((10000 * 52) / 12)); // 43333
  });
});

describe('buildOnboarding', () => {
  const input: OnboardingInput = {
    incomeMonthly: 300000,
    paydayDom: 25,
    essentials: { amount: 120000, cadence: 'monthly' },
    extras: { amount: 60000, cadence: 'monthly' },
    savingsMonthly: 20000,
    debtMonthly: 0,
  };

  it('maps income + payday', () => {
    expect(buildOnboarding(input).income).toEqual({ monthly: 300000, paydayDom: 25 });
  });

  it('maps essentials→bills, extras→discretionary, and splits lifestyle/joy 80/20', () => {
    const { plan } = buildOnboarding(input);
    expect(plan.bills).toBe(120000);
    expect(plan.savings).toBe(20000);
    expect(plan.debt).toBe(0);
    expect(plan.discretionary).toBe(60000);
    expect(plan.essentials).toBe(0);
    expect(plan.lifestyle).toBe(48000); // round(60000 * 0.8)
    expect(plan.joy).toBe(12000);       // discretionary - lifestyle
    expect(plan.essentials + plan.lifestyle + plan.joy).toBe(plan.discretionary);
  });

  it('converts a weekly extras amount to monthly before splitting', () => {
    const weekly = buildOnboarding({ ...input, extras: { amount: 15000, cadence: 'weekly' } }).plan;
    const monthly = Math.round((15000 * 52) / 12); // 65000
    expect(weekly.discretionary).toBe(monthly);
    expect(weekly.lifestyle).toBe(Math.round(monthly * 0.8));
    expect(weekly.joy).toBe(monthly - Math.round(monthly * 0.8));
  });
});

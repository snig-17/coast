import { buildPayment, isValidPayment, PaymentInput } from '../store/addPayment';

const base: PaymentInput = { name: 'Netflix', amount: '9.99', billingDay: '14', cadence: 'monthly', categoryId: 'phone' };

describe('isValidPayment', () => {
  it('requires a non-empty name and a positive amount', () => {
    expect(isValidPayment(base)).toBe(true);
    expect(isValidPayment({ ...base, name: '   ' })).toBe(false);
    expect(isValidPayment({ ...base, name: '' })).toBe(false);
    expect(isValidPayment({ ...base, amount: '0' })).toBe(false);
    expect(isValidPayment({ ...base, amount: '' })).toBe(false);
  });
});

describe('buildPayment', () => {
  it('trims name, parses amount to pence, passes cadence + category, uses id', () => {
    const p = buildPayment({ ...base, name: '  Netflix  ' }, 'pay_1');
    expect(p).toMatchObject({ id: 'pay_1', name: 'Netflix', amount: 999, cadence: 'monthly', categoryId: 'phone' });
  });

  it('clamps billingDay into 1..31, defaulting non-numeric to 1', () => {
    expect(buildPayment({ ...base, billingDay: '45' }, 'p').billingDay).toBe(31);
    expect(buildPayment({ ...base, billingDay: '0' }, 'p').billingDay).toBe(1);
    expect(buildPayment({ ...base, billingDay: '-3' }, 'p').billingDay).toBe(1);
    expect(buildPayment({ ...base, billingDay: 'x' }, 'p').billingDay).toBe(1);
    expect(buildPayment({ ...base, billingDay: '14' }, 'p').billingDay).toBe(14);
  });
});

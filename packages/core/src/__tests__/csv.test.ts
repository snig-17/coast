import { parseCsv } from '../csv';
import { categorize } from '../categorize';

const AMEX = `Date,Description,Amount
09/08/2026,TESCO STORES 1234,45.20
08/08/2026,NETFLIX.COM,9.99`;

const REVOLUT = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
CARD_PAYMENT,Current,2026-08-09 10:00:00,2026-08-09 10:00:01,Pret A Manger,-6.40,0.00,GBP,COMPLETED,100.00
TOPUP,Current,2026-08-08 09:00:00,2026-08-08 09:00:01,Salary,2000.00,0.00,GBP,COMPLETED,2100.00`;

describe('categorize', () => {
  it('maps known merchants to categories, else uncategorised', () => {
    expect(categorize('TESCO STORES 1234')).toBe('groceries');
    expect(categorize('NETFLIX.COM')).toBe('subscriptions');
    expect(categorize('Pret A Manger')).toBe('eating_out');
    expect(categorize('Something Unknown Ltd')).toBe('uncategorised');
  });
});

describe('parseCsv', () => {
  it('parses Amex charges as positive-pence spends', () => {
    const r = parseCsv(AMEX);
    expect(r.format).toBe('amex');
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toEqual({ date: '2026-08-09', amount: 4520, merchant: 'TESCO STORES 1234', categoryId: 'groceries' });
  });
  it('parses Revolut, keeping only outflows as spends', () => {
    const r = parseCsv(REVOLUT);
    expect(r.format).toBe('revolut');
    expect(r.rows).toHaveLength(1); // salary top-up excluded
    expect(r.rows[0]).toEqual({ date: '2026-08-09', amount: 640, merchant: 'Pret A Manger', categoryId: 'eating_out' });
  });
  it('returns unknown format with no rows for unrecognised input', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual({ format: 'unknown', rows: [] });
  });
});

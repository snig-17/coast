import { CATEGORIES } from '@coast/core';
import { parseAddParams, buildTransaction } from '../store/addEntry';

describe('parseAddParams', () => {
  it('parses a pounds amount and a valid category id', () => {
    expect(parseAddParams({ amount: '8.13', category: 'eating_out' }, CATEGORIES)).toEqual({
      amount: 813,
      categoryId: 'eating_out',
    });
  });
  it('accepts a £-prefixed amount', () => {
    expect(parseAddParams({ amount: '£12.50', category: 'shopping' }, CATEGORIES).amount).toBe(1250);
  });
  it('auto-categorises from merchant when no valid category is given', () => {
    const p = parseAddParams({ amount: '4.50', merchant: 'Pret A Manger' }, CATEGORIES);
    expect(p.categoryId).toBe('eating_out');
    expect(p.merchant).toBe('Pret A Manger');
  });
  it('falls back to uncategorised for unknown category + no merchant', () => {
    expect(parseAddParams({ amount: '3', category: 'nope' }, CATEGORIES).categoryId).toBe('uncategorised');
  });
  it('treats a junk amount as zero', () => {
    expect(parseAddParams({ amount: 'abc' }, CATEGORIES).amount).toBe(0);
  });
  it('keeps a provided note', () => {
    expect(parseAddParams({ amount: '1', note: 'Coffee' }, CATEGORIES).note).toBe('Coffee');
  });
});

describe('buildTransaction', () => {
  it('assembles a manual transaction with the given id and date', () => {
    const parsed = { amount: 813, categoryId: 'eating_out', note: 'Coffee', merchant: 'Pret' };
    expect(buildTransaction(parsed, '2026-08-09', 't_1')).toEqual({
      id: 't_1',
      amount: 813,
      categoryId: 'eating_out',
      date: '2026-08-09',
      note: 'Coffee',
      merchant: 'Pret',
      source: 'manual',
    });
  });
  it('omits optional note/merchant when absent', () => {
    const t = buildTransaction({ amount: 500, categoryId: 'uncategorised' }, '2026-08-09', 't_2');
    expect(t.note).toBeUndefined();
    expect(t.merchant).toBeUndefined();
  });
});

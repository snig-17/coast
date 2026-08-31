import { Transaction } from '@coast/core';
import {
  dedupKey,
  buildImportSession,
  toggleInclude,
  setRowCategory,
  summarize,
  commitRows,
} from '../store/importCsv';

const AMEX = [
  'Date,Description,Amount',
  '09/08/2026,Tesco,12.00',
  '10/08/2026,Pret A Manger,4.50',
  '11/08/2026,MONTHLY REFUND,-9.00', // credit -> dropped by core
].join('\n');

describe('dedupKey', () => {
  it('combines date + amount + lowercased merchant', () => {
    expect(dedupKey({ date: '2026-08-09', amount: 1200, merchant: 'Tesco' })).toBe(
      dedupKey({ date: '2026-08-09', amount: 1200, merchant: 'tesco' }),
    );
    expect(dedupKey({ date: '2026-08-09', amount: 1200, merchant: 'Tesco' })).not.toBe(
      dedupKey({ date: '2026-08-09', amount: 1300, merchant: 'Tesco' }),
    );
    expect(dedupKey({ date: '2026-08-09', amount: 1200 })).toContain('2026-08-09');
  });
});

describe('buildImportSession', () => {
  it('parses an Amex file to included, non-duplicate rows with unique keys', () => {
    const s = buildImportSession(AMEX, []);
    expect(s.format).toBe('amex');
    expect(s.rows).toHaveLength(2); // credit dropped
    expect(s.rows.every((r) => r.include && !r.duplicate)).toBe(true);
    expect(new Set(s.rows.map((r) => r.key)).size).toBe(2);
    expect(s.rows[0]).toMatchObject({ date: '2026-08-09', amount: 1200, merchant: 'Tesco' });
  });

  it('flags rows already in the store as duplicate and pre-excludes them', () => {
    const existing: Transaction[] = [
      { id: 'x', date: '2026-08-09', amount: 1200, merchant: 'Tesco', categoryId: 'food', source: 'manual' },
    ];
    const s = buildImportSession(AMEX, existing);
    const dup = s.rows.find((r) => r.merchant === 'Tesco')!;
    const other = s.rows.find((r) => r.merchant === 'Pret A Manger')!;
    expect(dup.duplicate).toBe(true);
    expect(dup.include).toBe(false);
    expect(other.duplicate).toBe(false);
    expect(other.include).toBe(true);
  });

  it('returns unknown/empty for a non-bank file', () => {
    const s = buildImportSession('a,b,c\n1,2,3', []);
    expect(s.format).toBe('unknown');
    expect(s.rows).toHaveLength(0);
  });
});

describe('toggleInclude / setRowCategory', () => {
  it('flips only the targeted row and returns a new array', () => {
    const s = buildImportSession(AMEX, []);
    const key = s.rows[0].key;
    const next = toggleInclude(s.rows, key);
    expect(next).not.toBe(s.rows);
    expect(next.find((r) => r.key === key)!.include).toBe(false);
    expect(next.find((r) => r.key === s.rows[1].key)!.include).toBe(true);
  });

  it('sets category on only the targeted row', () => {
    const s = buildImportSession(AMEX, []);
    const key = s.rows[1].key;
    const next = setRowCategory(s.rows, key, 'joy');
    expect(next.find((r) => r.key === key)!.categoryId).toBe('joy');
    expect(next.find((r) => r.key === s.rows[0].key)!.categoryId).toBe(s.rows[0].categoryId);
  });
});

describe('summarize', () => {
  it('counts totals and sums included amounts only', () => {
    const existing: Transaction[] = [
      { id: 'x', date: '2026-08-09', amount: 1200, merchant: 'Tesco', categoryId: 'food', source: 'manual' },
    ];
    const s = buildImportSession(AMEX, existing);
    const sum = summarize(s.rows);
    expect(sum.total).toBe(2);
    expect(sum.duplicates).toBe(1);
    expect(sum.included).toBe(1);
    expect(sum.includedAmount).toBe(450); // only Pret, £4.50
  });
});

describe('commitRows', () => {
  it('emits only included rows in order as import transactions', () => {
    const s = buildImportSession(AMEX, []);
    const txns = commitRows(s.rows, (_r, i) => `imp_${i}`);
    expect(txns).toHaveLength(2);
    expect(txns.map((t) => t.id)).toEqual(['imp_0', 'imp_1']);
    expect(txns.every((t) => t.source === 'import')).toBe(true);
    expect(txns[0]).toMatchObject({ date: '2026-08-09', amount: 1200, merchant: 'Tesco' });
    expect(txns[0].note).toBeUndefined();
  });

  it('skips excluded rows', () => {
    const s = buildImportSession(AMEX, []);
    const rows = toggleInclude(s.rows, s.rows[0].key); // exclude first
    const txns = commitRows(rows, (_r, i) => `imp_${i}`);
    expect(txns).toHaveLength(1);
    expect(txns[0].merchant).toBe('Pret A Manger');
  });

  it('returns empty for an unknown file', () => {
    const s = buildImportSession('nope', []);
    expect(commitRows(s.rows, (_r, i) => `imp_${i}`)).toEqual([]);
  });
});

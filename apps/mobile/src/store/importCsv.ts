import { parseCsv, ParsedTransaction, BankFormat, Transaction, Pence } from '@coast/core';

export interface ImportRow extends ParsedTransaction {
  key: string;        // stable per-row id within this session
  include: boolean;
  duplicate: boolean; // matches a transaction already in the store
}

export interface ImportSession {
  format: BankFormat;
  rows: ImportRow[];
}

export interface ImportSummary {
  total: number;
  included: number;
  duplicates: number;
  includedAmount: Pence;
}

/** Identity of a spend for duplicate detection: date + amount + merchant (case-insensitive). */
export function dedupKey(t: { date: string; amount: Pence; merchant?: string }): string {
  return `${t.date}|${t.amount}|${(t.merchant ?? '').trim().toLowerCase()}`;
}

export function buildImportSession(text: string, existing: Transaction[]): ImportSession {
  const { format, rows } = parseCsv(text);
  const existingKeys = new Set(existing.map((t) => dedupKey(t)));
  const decorated: ImportRow[] = rows.map((r, i) => {
    const duplicate = existingKeys.has(dedupKey(r));
    return {
      ...r,
      key: `${i}|${r.date}|${r.amount}|${r.merchant}`,
      duplicate,
      include: !duplicate,
    };
  });
  return { format, rows: decorated };
}

export function toggleInclude(rows: ImportRow[], key: string): ImportRow[] {
  return rows.map((r) => (r.key === key ? { ...r, include: !r.include } : r));
}

export function setRowCategory(rows: ImportRow[], key: string, categoryId: string): ImportRow[] {
  return rows.map((r) => (r.key === key ? { ...r, categoryId } : r));
}

export function summarize(rows: ImportRow[]): ImportSummary {
  let included = 0;
  let duplicates = 0;
  let includedAmount = 0;
  for (const r of rows) {
    if (r.duplicate) duplicates++;
    if (r.include) {
      included++;
      includedAmount += r.amount;
    }
  }
  return { total: rows.length, included, duplicates, includedAmount };
}

export function commitRows(
  rows: ImportRow[],
  makeId: (r: ImportRow, i: number) => string,
): Transaction[] {
  return rows
    .filter((r) => r.include)
    .map((r, i) => ({
      id: makeId(r, i),
      amount: r.amount,
      categoryId: r.categoryId,
      date: r.date,
      merchant: r.merchant,
      source: 'import' as const,
    }));
}

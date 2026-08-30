import { parseAmount, categorize, Category, Transaction, Pence } from '@coast/core';

export interface AddParams {
  amount?: string;
  category?: string;
  note?: string;
  merchant?: string;
}

export interface ParsedEntry {
  amount: Pence;
  categoryId: string;
  note?: string;
  merchant?: string;
}

export function parseAddParams(params: AddParams, categories: Category[]): ParsedEntry {
  const amount = parseAmount(params.amount ?? '');

  let categoryId: string;
  if (params.category && categories.some((c) => c.id === params.category)) {
    categoryId = params.category;
  } else if (params.merchant || params.note) {
    categoryId = categorize(params.merchant ?? params.note ?? '');
  } else {
    categoryId = 'uncategorised';
  }

  const entry: ParsedEntry = { amount, categoryId };
  if (params.note) entry.note = params.note;
  if (params.merchant) entry.merchant = params.merchant;
  return entry;
}

export function buildTransaction(parsed: ParsedEntry, dateIso: string, id: string): Transaction {
  const t: Transaction = {
    id,
    amount: parsed.amount,
    categoryId: parsed.categoryId,
    date: dateIso,
    source: 'manual',
  };
  if (parsed.note) t.note = parsed.note;
  if (parsed.merchant) t.merchant = parsed.merchant;
  return t;
}

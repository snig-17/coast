import { parseAmount, Payment, Cadence } from '@coast/core';

export interface PaymentInput {
  name: string;
  amount: string;
  billingDay: string;
  cadence: Cadence;
  categoryId: string;
}

function clampDay(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(Math.trunc(n), 1), 31);
}

export function isValidPayment(input: PaymentInput): boolean {
  return input.name.trim().length > 0 && parseAmount(input.amount) > 0;
}

export function buildPayment(input: PaymentInput, id: string): Payment {
  return {
    id,
    name: input.name.trim(),
    amount: parseAmount(input.amount),
    cadence: input.cadence,
    billingDay: clampDay(input.billingDay),
    categoryId: input.categoryId,
  };
}

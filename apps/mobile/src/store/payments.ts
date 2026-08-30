import { Payment } from '@coast/core';

export interface Billing {
  day: number;
  iso: string;
  payment: Payment;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function billingsForMonth(payments: Payment[], year: number, month0: number): Billing[] {
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  return payments
    .map((payment) => {
      const day = Math.min(payment.billingDay, lastDay);
      return { day, iso: `${year}-${pad(month0 + 1)}-${pad(day)}`, payment };
    })
    .sort((a, b) => a.day - b.day);
}

export function upcomingBillings(payments: Payment[], year: number, month0: number, fromDay: number): Billing[] {
  return billingsForMonth(payments, year, month0).filter((b) => b.day >= fromDay);
}

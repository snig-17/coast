export type Pence = number;

export function parseAmount(input: string): Pence {
  const cleaned = input.replace(/[^0-9.\-]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
  const value = Math.round(parseFloat(cleaned) * 100);
  return Number.isFinite(value) ? value : 0;
}

export type MoneyMode = 'auto' | 'exact' | 'whole';

export function formatGBP(pence: Pence, mode: MoneyMode = 'auto'): string {
  const negative = pence < 0;
  const abs = Math.abs(pence);
  let body: string;
  if (mode === 'whole') {
    body = Math.round(abs / 100).toLocaleString('en-GB');
  } else if (mode === 'exact' || abs % 100 !== 0) {
    body = (abs / 100).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    body = Math.trunc(abs / 100).toLocaleString('en-GB');
  }
  return `${negative ? '-' : ''}£${body}`;
}

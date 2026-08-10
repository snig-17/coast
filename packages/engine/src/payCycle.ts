const MS_PER_DAY = 86_400_000;

function lastDomOf(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function paydayForMonthOffset(ref: Date, dom: number, offset: number): Date {
  const totalMonths = ref.getUTCMonth() + offset;
  const year = ref.getUTCFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(dom, lastDomOf(year, month));
  return new Date(Date.UTC(year, month, day));
}

export interface PayCycle {
  start: Date;
  nextPayday: Date;
  displayEnd: Date;
  daysUntilPayday: number;
  cycleLengthDays: number;
}

export function payCycle(paydayDom: number, ref: Date): PayCycle {
  const refDay = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const thisPayday = paydayForMonthOffset(ref, paydayDom, 0);

  let start: Date;
  let nextPayday: Date;
  if (refDay.getTime() >= thisPayday.getTime()) {
    start = thisPayday;
    nextPayday = paydayForMonthOffset(ref, paydayDom, 1);
  } else {
    start = paydayForMonthOffset(ref, paydayDom, -1);
    nextPayday = thisPayday;
  }

  const daysUntilPayday = Math.round((nextPayday.getTime() - refDay.getTime()) / MS_PER_DAY);
  const cycleLengthDays = Math.round((nextPayday.getTime() - start.getTime()) / MS_PER_DAY);
  const displayEnd = new Date(nextPayday.getTime() - MS_PER_DAY);

  return { start, nextPayday, displayEnd, daysUntilPayday, cycleLengthDays };
}

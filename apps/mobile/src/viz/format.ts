import { PayCycle, SpendRoom } from '@coast/engine';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function cycleLabel(cycle: PayCycle): string {
  const s = cycle.start;
  const e = cycle.displayEnd;
  const start = `${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]}`;
  const end = `${e.getUTCDate()} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
  return `${start} — ${end}`;
}

export function weekdayLabel(now: Date): string {
  return DAYS[now.getUTCDay()];
}

export function monthLabel(now: Date): string {
  return MONTHS_FULL[now.getUTCMonth()];
}

export interface Pace {
  onPace: boolean;
  text: string;
}

export function paceLabel(room: SpendRoom): Pace {
  return room.onPace
    ? { onPace: true, text: "You're on pace." }
    : { onPace: false, text: 'Over today\'s room.' };
}

import { payCycle, spendRoom, SpendRoom } from '@coast/engine';
import { SEED_STATE, categoriesById } from '@coast/core';
import { cycleLabel, weekdayLabel, monthLabel, paceLabel } from '../viz/format';

const ref = new Date('2026-08-09T12:00:00Z');
const cycle = payCycle(31, ref);

describe('format helpers', () => {
  it('labels the pay cycle as start — displayEnd year', () => {
    expect(cycleLabel(cycle)).toBe('31 Jul — 30 Aug 2026');
  });
  it('names the weekday in caps (UTC)', () => {
    expect(weekdayLabel(new Date('1970-01-04T00:00:00Z'))).toBe('SUNDAY');
    expect(weekdayLabel(new Date('1970-01-05T00:00:00Z'))).toBe('MONDAY');
  });
  it('names the month in caps', () => {
    expect(monthLabel(ref)).toBe('AUGUST');
  });
  it('reports pace from spend room', () => {
    const room: SpendRoom = spendRoom(SEED_STATE.plan, [], categoriesById(SEED_STATE.categories), cycle, ref);
    expect(paceLabel(room)).toEqual({ onPace: true, text: "You're on pace." });
  });
});

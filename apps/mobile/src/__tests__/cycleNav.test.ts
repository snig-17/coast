import { SEED_STATE } from '@coast/core';
import { cycleAtOffset, selectCycleSummaryAtOffset } from '../store/cycleNav';

const ref = new Date('2026-08-09T12:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('cycleAtOffset', () => {
  it('offset 0 is the current cycle', () => {
    expect(iso(cycleAtOffset(31, ref, 0).start)).toBe('2026-07-31');
  });
  it('negative offset walks back a whole cycle', () => {
    expect(iso(cycleAtOffset(31, ref, -1).start)).toBe('2026-06-30');
  });
  it('positive offset walks forward a whole cycle', () => {
    expect(iso(cycleAtOffset(31, ref, 1).start)).toBe('2026-08-31');
  });
});

describe('selectCycleSummaryAtOffset', () => {
  it('an empty current cycle totals zero', () => {
    expect(selectCycleSummaryAtOffset(SEED_STATE, ref, 0).totalSpent).toBe(0);
  });
});

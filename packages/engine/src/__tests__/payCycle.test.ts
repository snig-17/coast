import { payCycle } from '../payCycle';

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('payCycle', () => {
  it('computes the current cycle from the reference screenshots', () => {
    const c = payCycle(31, new Date('2026-08-09T12:00:00Z'));
    expect(iso(c.start)).toBe('2026-07-31');
    expect(iso(c.nextPayday)).toBe('2026-08-31');
    expect(iso(c.displayEnd)).toBe('2026-08-30');
    expect(c.daysUntilPayday).toBe(22);
    expect(c.cycleLengthDays).toBe(31);
  });
  it('when ref is exactly payday, the cycle starts today', () => {
    const c = payCycle(31, new Date('2026-08-31T00:00:00Z'));
    expect(iso(c.start)).toBe('2026-08-31');
    expect(iso(c.nextPayday)).toBe('2026-09-30'); // Sept has 30 days -> clamped
  });
  it('clamps payday to the last day of shorter months', () => {
    const c = payCycle(31, new Date('2026-02-10T00:00:00Z'));
    expect(iso(c.start)).toBe('2026-01-31');
    expect(iso(c.nextPayday)).toBe('2026-02-28');
  });
});

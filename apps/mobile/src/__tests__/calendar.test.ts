import { monthGrid } from '../viz/calendar';

describe('monthGrid', () => {
  it('Jan 2024 starts on Monday with 31 day cells, padded to whole weeks', () => {
    const cells = monthGrid(2024, 0); // Jan 1 2024 was a Monday
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((c) => c.day !== null)).toHaveLength(31);
    expect(cells[0]).toEqual({ day: 1, iso: '2024-01-01' });
  });
  it('Feb 2026 has 28 day cells', () => {
    expect(monthGrid(2026, 1).filter((c) => c.day !== null)).toHaveLength(28);
  });
  it('leading blanks appear before day 1 when the month does not start on Monday', () => {
    const cells = monthGrid(2026, 7); // August 2026
    const firstDayIndex = cells.findIndex((c) => c.day === 1);
    expect(firstDayIndex).toBeGreaterThan(0);
    expect(cells.slice(0, firstDayIndex).every((c) => c.day === null)).toBe(true);
  });
});

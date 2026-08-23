import { SEED_STATE } from '@coast/core';
import { planBreakdown } from '@coast/engine';
import { donutStrokes } from '../viz/geometry';

describe('donutStrokes', () => {
  const b = planBreakdown(SEED_STATE.plan);
  const r = 100;
  const C = 2 * Math.PI * r;

  it('lengths are proportional to each segment pct and offsets accumulate', () => {
    const strokes = donutStrokes(b.segments, r);
    expect(strokes).toHaveLength(4);
    expect(strokes[0].offset).toBe(0);
    // bills is first: length = pct * circumference
    expect(strokes[0].length).toBeCloseTo((152000 / 206500) * C, 6);
    // second offset equals first length
    expect(strokes[1].offset).toBeCloseTo(strokes[0].length, 6);
    // total length ~= full circumference (debt is 0-length)
    const total = strokes.reduce((s, x) => s + x.length, 0);
    expect(total).toBeCloseTo(C, 6);
  });

  it('is safe for an all-zero plan', () => {
    const strokes = donutStrokes(
      planBreakdown({ bills: 0, savings: 0, debt: 0, discretionary: 0, essentials: 0, lifestyle: 0, joy: 0 }).segments,
      r,
    );
    expect(strokes.every((s) => s.length === 0)).toBe(true);
  });
});

import { PlanSegment } from '@coast/engine';

export interface DonutStroke {
  group: PlanSegment['group'];
  length: number;
  offset: number;
}

export function donutStrokes(segments: PlanSegment[], radius: number): DonutStroke[] {
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const out: DonutStroke[] = [];
  for (const s of segments) {
    const length = s.pct * circumference;
    out.push({ group: s.group, length, offset });
    offset += length;
  }
  return out;
}

export interface MonthCell {
  day: number | null;
  iso?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function monthGrid(year: number, month0: number): MonthCell[] {
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const firstDow = (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${year}-${pad(month0 + 1)}-${pad(d)}` });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
}

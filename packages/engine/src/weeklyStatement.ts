import { Transaction, Category, Pence } from '@coast/core';

export type WeekdayLabel = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
const LABELS: WeekdayLabel[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MS_PER_DAY = 86_400_000;

export interface DailyLedgerEntry {
  day: WeekdayLabel;
  date: string;
  scored: boolean;
  amount: Pence;
}

export interface WeeklyStatementView {
  issueNumber: number;
  weekStart: string;
  weekEnd: string;
  daysScored: number;
  daysUnder: number;
  plannedSpend: Pence;
  actualSpend: Pence;
  leaksSpotted: Pence;
  movedForward: Pence;
  weeklyLine: Pence;
  weeklySpend: Pence;
  dailyLedger: DailyLedgerEntry[];
  result: Pence;
  nextDailyLine: Pence;
  carry: Pence;
}

export interface WeeklyStatementInput {
  issueNumber: number;
  weekStart: Date;   // Monday
  transactions: Transaction[];
  categoriesById: Record<string, Category>;
  weeklyLine: Pence; // planned line for this week (0 if pre-plan)
  currentDailyRoom: Pence;
  leaksSpotted: Pence;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function isSpend(t: Transaction, cats: Record<string, Category>): boolean {
  const group = cats[t.categoryId]?.group;
  return group === 'discretionary' || group === 'bills';
}

export function weeklyStatement(input: WeeklyStatementInput): WeeklyStatementView {
  const { issueNumber, weekStart, transactions, categoriesById, weeklyLine, currentDailyRoom, leaksSpotted } = input;
  const scored = weeklyLine > 0;
  const dailyLine = weeklyLine / 7;

  const dailyLedger: DailyLedgerEntry[] = LABELS.map((day, i) => {
    const date = iso(new Date(weekStart.getTime() + i * MS_PER_DAY));
    const amount = transactions
      .filter((t) => t.date === date && isSpend(t, categoriesById))
      .reduce((sum, t) => sum + t.amount, 0);
    return { day, date, scored, amount };
  });

  const actualSpend = dailyLedger.reduce((sum, e) => sum + e.amount, 0);
  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekStartMs + 7 * MS_PER_DAY;
  const movedForward = transactions
    .filter((t) => {
      if (categoriesById[t.categoryId]?.group !== 'savings') return false;
      const tMs = new Date(t.date).getTime();
      return tMs >= weekStartMs && tMs < weekEndMs;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const daysScored = scored ? 7 : 0;
  const daysUnder = scored ? dailyLedger.filter((e) => e.amount <= dailyLine).length : 0;
  const result = weeklyLine - actualSpend;
  const nextDailyLine = Math.ceil(currentDailyRoom / 100) * 100;

  return {
    issueNumber,
    weekStart: iso(weekStart),
    weekEnd: iso(new Date(weekStart.getTime() + 6 * MS_PER_DAY)),
    daysScored,
    daysUnder,
    plannedSpend: weeklyLine,
    actualSpend,
    leaksSpotted,
    movedForward,
    weeklyLine,
    weeklySpend: actualSpend,
    dailyLedger,
    result,
    nextDailyLine,
    carry: result,
  };
}

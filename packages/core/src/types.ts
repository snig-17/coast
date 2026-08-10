import { Pence } from './money';

export type Cadence = 'weekly' | 'monthly';
export type CategoryGroup = 'bills' | 'savings' | 'debt' | 'discretionary';
export type DiscretionarySubpool = 'essentials' | 'lifestyle' | 'joy';
export type EntrySource = 'manual' | 'import';

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
  subpool?: DiscretionarySubpool; // present only when group === 'discretionary'
  color: string;                  // hex
  icon: string;                   // ionicons name
}

export interface Transaction {
  id: string;
  amount: Pence;      // positive = money spent
  categoryId: string;
  date: string;       // ISO yyyy-mm-dd
  note?: string;
  merchant?: string;
  source: EntrySource;
}

export interface Payment {
  id: string;
  name: string;
  amount: Pence;
  cadence: Cadence;
  billingDay: number; // day of month
  categoryId: string;
}

export interface Income {
  monthly: Pence;
  paydayDom: number;  // day of month
}

export interface BudgetPlan {
  bills: Pence;
  savings: Pence;
  debt: Pence;
  discretionary: Pence;
  essentials: Pence;  // discretionary subpool
  lifestyle: Pence;   // discretionary subpool (drives daily spend room)
  joy: Pence;         // discretionary subpool (protected)
}

export interface Fund {
  id: string;
  name: string;
  goal: Pence;
  saved: Pence;
}

export interface Leak {
  id: string;
  merchant: string;
  annual: Pence;
  closed: boolean;
}

export type StatementStatus = 'readyToStamp' | 'stamped';

export interface Statement {
  id: string;
  issueNumber: number; // ISO week number
  weekStart: string;   // ISO yyyy-mm-dd (Monday)
  issuedDate: string;  // ISO yyyy-mm-dd
  status: StatementStatus;
}

export interface CoastState {
  schemaVersion: number;
  onboardingComplete: boolean;
  profileName: string;
  memberSince: string; // ISO yyyy-mm-dd
  income: Income;
  plan: BudgetPlan;
  categories: Category[];
  transactions: Transaction[];
  payments: Payment[];
  funds: Fund[];
  leaks: Leak[];
  statements: Statement[];
}

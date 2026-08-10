import { Category, CategoryGroup } from './types';

export const CATEGORIES: Category[] = [
  // Bills & Fixed
  { id: 'rent',          name: 'Rent',          group: 'bills', color: '#1A1A1A', icon: 'home' },
  { id: 'utilities',     name: 'Utilities',     group: 'bills', color: '#1A1A1A', icon: 'flash' },
  { id: 'phone',         name: 'Phone',         group: 'bills', color: '#1A1A1A', icon: 'call' },
  { id: 'insurance',     name: 'Insurance',     group: 'bills', color: '#1A1A1A', icon: 'shield' },
  // Savings
  { id: 'savings',       name: 'Savings',       group: 'savings', color: '#2E7D5B', icon: 'wallet' },
  // Debt
  { id: 'debt',          name: 'Debt',          group: 'debt', color: '#D98A3D', icon: 'card' },
  // Discretionary — essentials
  { id: 'groceries',     name: 'Groceries',     group: 'discretionary', subpool: 'essentials', color: '#7A7A70', icon: 'cart' },
  { id: 'transport',     name: 'Transport',     group: 'discretionary', subpool: 'essentials', color: '#7A7A70', icon: 'bus' },
  { id: 'health',        name: 'Health',        group: 'discretionary', subpool: 'essentials', color: '#7A7A70', icon: 'medkit' },
  // Discretionary — lifestyle (drives spend room)
  { id: 'eating_out',    name: 'Eating out',    group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'restaurant' },
  { id: 'shopping',      name: 'Shopping',      group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'bag' },
  { id: 'fun',           name: 'Fun',           group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'sparkles' },
  { id: 'uncategorised', name: 'Uncategorised', group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'ellipsis-horizontal' },
  // Discretionary — joy (protected)
  { id: 'subscriptions', name: 'Subscriptions', group: 'discretionary', subpool: 'joy', color: '#E4694E', icon: 'tv' },
  { id: 'treats',        name: 'Treats',        group: 'discretionary', subpool: 'joy', color: '#E4694E', icon: 'gift' },
];

export function categoriesById(cats: Category[] = CATEGORIES): Record<string, Category> {
  return Object.fromEntries(cats.map((c) => [c.id, c]));
}

export function categoryGroup(id: string, cats: Category[] = CATEGORIES): CategoryGroup | undefined {
  return cats.find((c) => c.id === id)?.group;
}

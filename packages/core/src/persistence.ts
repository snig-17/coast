import { CoastState } from './types';
import { SEED_STATE } from './seed';

export const SCHEMA_VERSION = 1;

export function serialize(state: CoastState): string {
  return JSON.stringify(state);
}

function isCoastState(value: unknown): value is CoastState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.schemaVersion === 'number' &&
    typeof v.income === 'object' && v.income !== null &&
    typeof v.plan === 'object' && v.plan !== null &&
    Array.isArray(v.transactions) &&
    Array.isArray(v.categories)
  );
}

export function migrate(state: CoastState): CoastState {
  // v1 is current; future versions add cases here.
  return { ...state, schemaVersion: SCHEMA_VERSION };
}

export function deserialize(json: string): CoastState {
  const parsed = JSON.parse(json); // throws on non-JSON, by design
  if (!isCoastState(parsed)) {
    return JSON.parse(JSON.stringify(SEED_STATE)) as CoastState;
  }
  return migrate(parsed);
}

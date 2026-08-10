import { CoastState, SEED_STATE, serialize, deserialize } from '@coast/core';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const STORAGE_KEY = 'coast/state/v1';

const freshSeed = (): CoastState => JSON.parse(JSON.stringify(SEED_STATE));

export async function loadState(kv: KeyValueStore): Promise<CoastState> {
  const raw = await kv.getItem(STORAGE_KEY);
  if (raw == null) return freshSeed();
  try {
    return deserialize(raw);
  } catch {
    return freshSeed();
  }
}

export async function saveState(kv: KeyValueStore, state: CoastState): Promise<void> {
  await kv.setItem(STORAGE_KEY, serialize(state));
}

import { SEED_STATE } from '@coast/core';
import { KeyValueStore, STORAGE_KEY, loadState, saveState } from '../store/persistence';

function memoryKV(seed: Record<string, string> = {}): KeyValueStore {
  const map = new Map(Object.entries(seed));
  return {
    getItem: async (k) => (map.has(k) ? map.get(k)! : null),
    setItem: async (k, v) => { map.set(k, v); },
  };
}

describe('persistence', () => {
  it('round-trips saved state', async () => {
    const kv = memoryKV();
    await saveState(kv, SEED_STATE);
    expect(await loadState(kv)).toEqual(SEED_STATE);
  });
  it('returns a fresh seed copy when nothing is stored', async () => {
    const loaded = await loadState(memoryKV());
    expect(loaded.income.monthly).toBe(SEED_STATE.income.monthly);
    expect(loaded).not.toBe(SEED_STATE);
  });
  it('falls back to seed on corrupt data instead of throwing', async () => {
    const loaded = await loadState(memoryKV({ [STORAGE_KEY]: 'not json' }));
    expect(loaded.income.monthly).toBe(SEED_STATE.income.monthly);
  });
});

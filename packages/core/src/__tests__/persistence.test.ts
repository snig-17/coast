import { serialize, deserialize, SCHEMA_VERSION } from '../persistence';
import { SEED_STATE } from '../seed';

describe('persistence', () => {
  it('round-trips the seed state unchanged', () => {
    const restored = deserialize(serialize(SEED_STATE));
    expect(restored).toEqual(SEED_STATE);
  });
  it('exposes the current schema version', () => {
    expect(SEED_STATE.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('falls back to a fresh seed when the shape is invalid', () => {
    const restored = deserialize('{"nonsense": true}');
    expect(restored.income.monthly).toBe(SEED_STATE.income.monthly);
    expect(restored).not.toBe(SEED_STATE); // a copy, not the shared reference
  });
  it('throws on non-JSON input', () => {
    expect(() => deserialize('not json')).toThrow();
  });
});

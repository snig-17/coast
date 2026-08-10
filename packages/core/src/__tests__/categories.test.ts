import { CATEGORIES, categoriesById, categoryGroup } from '../categories';

describe('CATEGORIES catalog', () => {
  it('has unique ids', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('gives every category a colour and icon', () => {
    for (const c of CATEGORIES) {
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.icon.length).toBeGreaterThan(0);
    }
  });
  it('only discretionary categories carry a subpool', () => {
    for (const c of CATEGORIES) {
      if (c.group === 'discretionary') expect(c.subpool).toBeDefined();
      else expect(c.subpool).toBeUndefined();
    }
  });
  it('resolves group by id', () => {
    expect(categoryGroup('rent')).toBe('bills');
    expect(categoryGroup('eating_out')).toBe('discretionary');
    expect(categoryGroup('nope')).toBeUndefined();
  });
  it('indexes by id', () => {
    expect(categoriesById()['savings'].group).toBe('savings');
  });
});

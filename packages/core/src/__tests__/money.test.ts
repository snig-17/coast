import { parseAmount, formatGBP } from '../money';

describe('parseAmount', () => {
  it('parses plain and symbol-prefixed amounts to pence', () => {
    expect(parseAmount('8.13')).toBe(813);
    expect(parseAmount('£1,520.00')).toBe(152000);
    expect(parseAmount('-12.50')).toBe(-1250);
  });
  it('treats blanks and junk as zero', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('-')).toBe(0);
    expect(parseAmount('n/a')).toBe(0);
  });
});

describe('formatGBP', () => {
  it('auto: hides decimals for whole pounds, shows them otherwise', () => {
    expect(formatGBP(152000)).toBe('£1,520');
    expect(formatGBP(206500)).toBe('£2,065');
    expect(formatGBP(813)).toBe('£8.13');
    expect(formatGBP(17886)).toBe('£178.86');
    expect(formatGBP(0)).toBe('£0');
  });
  it('exact: always two decimals', () => {
    expect(formatGBP(0, 'exact')).toBe('£0.00');
    expect(formatGBP(152000, 'exact')).toBe('£1,520.00');
  });
  it('whole: rounds to the nearest pound', () => {
    expect(formatGBP(813, 'whole')).toBe('£8');
    expect(formatGBP(17886, 'whole')).toBe('£179');
  });
  it('keeps a leading minus for negatives', () => {
    expect(formatGBP(-1250)).toBe('-£12.50');
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeDateOnly } from './dateOnly';

describe('calendar dates', () => {
  it('preserves the source day regardless of timestamp offset', () => {
    expect(normalizeDateOnly('2026-09-19T00:00:00+05:00')).toBe('2026-09-19');
    expect(normalizeDateOnly('2026-09-19T23:00:00-07:00')).toBe('2026-09-19');
    expect(normalizeDateOnly(new Date(2026, 8, 19))).toBe('2026-09-19');
  });
  it('supports stored ISO and legacy dates', () => {
    expect(normalizeDateOnly('2026-09-19')).toBe('2026-09-19');
    expect(normalizeDateOnly('19-Sep-2026')).toBe('2026-09-19');
    expect(normalizeDateOnly('2024-02-29')).toBe('2024-02-29');
  });
  it('rejects impossible dates and clears empty values', () => {
    for (const value of [null, undefined, '', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', 'invalid', new Date(NaN)]) {
      expect(normalizeDateOnly(value)).toBe('');
    }
  });
});

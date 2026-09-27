import { describe, it, expect } from 'vitest';
import { normalizeDateOnly, formatDate, formatDateTime, formatDisplayValue } from './dateOnly';

describe('calendar dates', () => {
  it('round trips the agreed display format without changing the API date', () => {
    expect(normalizeDateOnly('26/Sep/2026')).toBe('2026-09-26');
    expect(normalizeDateOnly('29/Feb/2024')).toBe('2024-02-29');
    expect(normalizeDateOnly('29/Feb/2026')).toBe('');
    expect(normalizeDateOnly('31/Apr/2026')).toBe('');
    expect(formatDate('2026-09-26')).toBe('26/Sep/2026');
    expect(formatDateTime('2026-09-26T23:45:00+05:00')).toBe('26/Sep/2026 23:45:00 +05:00');
    expect(formatDisplayValue('Ready')).toBe('Ready');
    expect(formatDisplayValue(0)).toBe(0);
    expect(formatDisplayValue(false)).toBe(false);
  });
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

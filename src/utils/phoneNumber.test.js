import { describe, expect, it } from 'vitest';
import { combinePhoneNumber, phoneNumberError, splitPhoneNumber } from './phoneNumber';

describe('contact phone numbers', () => {
  it('normalizes national dialing prefixes and retains international country codes', () => {
    expect(combinePhoneNumber('GB', '07700900123')).toBe('+447700900123');
    expect(combinePhoneNumber('US', '2133734253')).toBe('+12133734253');
    expect(splitPhoneNumber('+12133734253')).toEqual({ country: 'US', national: '2133734253' });
  });
  it('rejects missing codes, invalid lengths, alphabetic and malformed input', () => {
    for (const value of ['2133734253', '+1123', '+12000000000', '+1213ABC4253', '+12133734253123456', '+12.133734253']) expect(phoneNumberError(value)).not.toBe('');
    expect(phoneNumberError('+12133734253')).toBe('');
    expect(phoneNumberError('')).toBe('');
    expect(phoneNumberError('', true)).not.toBe('');
  });
});

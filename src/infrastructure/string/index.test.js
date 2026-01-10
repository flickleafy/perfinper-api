import { extractNumberFromString } from './index.js';

describe('extractNumberFromString', () => {
  test('extracts the first number sequence', () => {
    expect(extractNumberFromString('abc123def')).toBe(123);
    expect(extractNumberFromString('9a8')).toBe(9);
  });

  test('returns null when no digits are found', () => {
    expect(extractNumberFromString('no digits here')).toBeNull();
  });
});

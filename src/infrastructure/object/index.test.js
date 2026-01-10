import { isObject } from './index.js';

describe('isObject', () => {
  test('returns true for plain objects and date objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject(new Date())).toBe(true);
  });

  test('returns false for arrays, null, and primitives', () => {
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('text')).toBe(false);
    expect(isObject(123)).toBe(false);
  });
});

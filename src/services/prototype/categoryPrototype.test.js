import { categoryPrototype } from './categoryPrototype.js';

describe('categoryPrototype', () => {
  test('returns only name and iconName', () => {
    const input = { name: 'Food', iconName: 'utensils', extra: 'ignore' };

    const result = categoryPrototype(input);

    expect(result).toEqual({ name: 'Food', iconName: 'utensils' });
    expect(result).not.toBe(input);
  });
});

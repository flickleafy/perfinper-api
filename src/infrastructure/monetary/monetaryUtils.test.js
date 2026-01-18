import {
  normalizeMonetaryValue,
  parseMonetaryValue,
  formatMonetaryDisplay,
} from './monetaryUtils.js';

describe('monetaryUtils', () => {
  describe('normalizeMonetaryValue', () => {
    test('should handle null/undefined/empty', () => {
      expect(normalizeMonetaryValue(null)).toBe('0,00');
      expect(normalizeMonetaryValue(undefined)).toBe('0,00');
      expect(normalizeMonetaryValue('')).toBe('0,00');
    });

    test('should handle number input', () => {
      expect(normalizeMonetaryValue(1500.44)).toBe('1500,44');
      expect(normalizeMonetaryValue(1500)).toBe('1500,00');
      expect(normalizeMonetaryValue(-1500.44)).toBe('1500,44'); // absolute
    });

    test('should handle comma decimal format (Brazilian)', () => {
      expect(normalizeMonetaryValue('1500,44')).toBe('1500,44');
      expect(normalizeMonetaryValue('203,24')).toBe('203,24');
      expect(normalizeMonetaryValue('0,99')).toBe('0,99');
    });

    test('should handle period decimal format (US)', () => {
      expect(normalizeMonetaryValue('1500.44')).toBe('1500,44');
      expect(normalizeMonetaryValue('203.24')).toBe('203,24');
    });

    test('should handle thousand separators with comma decimal', () => {
      expect(normalizeMonetaryValue('1.500,44')).toBe('1500,44');
      expect(normalizeMonetaryValue('27.361,44')).toBe('27361,44');
    });

    test('should handle thousand separators with period decimal', () => {
      expect(normalizeMonetaryValue('1,500.44')).toBe('1500,44');
      expect(normalizeMonetaryValue('27,361.44')).toBe('27361,44');
    });

    test('should handle currency symbols', () => {
      expect(normalizeMonetaryValue('R$ 1500,44')).toBe('1500,44');
      expect(normalizeMonetaryValue('R$1500.44')).toBe('1500,44');
    });

    test('should handle negative values', () => {
      expect(normalizeMonetaryValue('-1500,44')).toBe('1500,44');
      expect(normalizeMonetaryValue('-1500.44')).toBe('1500,44');
    });
  });

  describe('parseMonetaryValue', () => {
    test('should handle number input', () => {
      expect(parseMonetaryValue(1500.44)).toBe(1500.44);
      expect(parseMonetaryValue(-1500.44)).toBe(1500.44);
    });

    test('should parse comma decimal format', () => {
      expect(parseMonetaryValue('1500,44')).toBe(1500.44);
      expect(parseMonetaryValue('203,24')).toBe(203.24);
    });

    test('should parse period decimal format', () => {
      expect(parseMonetaryValue('1500.44')).toBe(1500.44);
    });

    test('should handle null/undefined/empty', () => {
      expect(parseMonetaryValue(null)).toBe(0);
      expect(parseMonetaryValue(undefined)).toBe(0);
      expect(parseMonetaryValue('')).toBe(0);
    });
  });

  describe('formatMonetaryDisplay', () => {
    test('should format with symbol', () => {
      expect(formatMonetaryDisplay(1500.44)).toBe('R$ 1.500,44');
      expect(formatMonetaryDisplay('27361,44')).toBe('R$ 27.361,44');
    });

    test('should format without symbol', () => {
      expect(formatMonetaryDisplay(1500.44, false)).toBe('1.500,44');
    });

    test('should handle large numbers', () => {
      expect(formatMonetaryDisplay(1000000.00)).toBe('R$ 1.000.000,00');
    });
  });
});

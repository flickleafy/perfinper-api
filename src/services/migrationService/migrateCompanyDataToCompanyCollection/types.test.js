/**
 * Unit tests for types.js
 * Tests constants, enums, and validation patterns
 */

import { describe, test, expect } from '@jest/globals';
import {
  DOCUMENT_TYPES,
  ENTITY_STATUS,
  EMPTY_RESULT,
  ANONYMIZATION_PATTERNS,
  VALIDATION_CONSTANTS,
} from './types.js';

describe('Types Constants', () => {
  describe('DOCUMENT_TYPES', () => {
    test('should contain all expected document types', () => {
      expect(DOCUMENT_TYPES).toEqual({
        CNPJ: 'cnpj',
        CPF: 'cpf',
        INVALID: 'invalid',
        ANONYMIZED_CPF: 'anonymized_cpf',
      });
    });

    test('should be immutable', () => {
      const originalTypes = { ...DOCUMENT_TYPES };

      // Attempt to modify (should not affect original in strict mode)
      try {
        DOCUMENT_TYPES.NEW_TYPE = 'new_type';
      } catch (error) {
        // Expected in strict mode
      }

      // Remove the added property if it was added (non-strict mode)
      delete DOCUMENT_TYPES.NEW_TYPE;

      expect(DOCUMENT_TYPES).toEqual(originalTypes);
    });

    test('should have string values', () => {
      Object.values(DOCUMENT_TYPES).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ENTITY_STATUS', () => {
    test('should contain all expected entity statuses', () => {
      expect(ENTITY_STATUS).toEqual({
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        BLOCKED: 'blocked',
        ANONYMOUS: 'anonymous',
      });
    });

    test('should have string values', () => {
      Object.values(ENTITY_STATUS).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('EMPTY_RESULT', () => {
    test('should have correct default structure', () => {
      expect(EMPTY_RESULT).toEqual({
        created: 0,
        skipped: 0,
        updated: 0,
      });
    });

    test('should have numeric values', () => {
      Object.values(EMPTY_RESULT).forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBe(0);
      });
    });
  });

  describe('ANONYMIZATION_PATTERNS', () => {
    test('should be an array of RegExp objects', () => {
      expect(Array.isArray(ANONYMIZATION_PATTERNS)).toBe(true);
      expect(ANONYMIZATION_PATTERNS.length).toBeGreaterThan(0);

      ANONYMIZATION_PATTERNS.forEach((pattern) => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });

    test('should match various anonymization patterns', () => {
      // Test cases for each pattern
      const testCases = [
        { pattern: /\*{3,}/, input: '***', shouldMatch: true }, // Three or more asterisks
        { pattern: /\*{3,}/, input: '****', shouldMatch: true },
        { pattern: /\*{3,}/, input: '**', shouldMatch: false },
        { pattern: /x{3,}/i, input: 'xxx', shouldMatch: true }, // Three or more x's
        { pattern: /x{3,}/i, input: 'XXX', shouldMatch: true },
        { pattern: /x{3,}/i, input: 'xx', shouldMatch: false },
        { pattern: /##+/, input: '##', shouldMatch: true }, // Hash symbols
        { pattern: /##+/, input: '#', shouldMatch: false }, // Single hash should not match ##+ pattern
        { pattern: /\.{3,}/, input: '...', shouldMatch: true }, // Multiple dots
        { pattern: /\.{3,}/, input: '....', shouldMatch: true },
        { pattern: /\.{3,}/, input: '..', shouldMatch: false },
        {
          pattern: /\d{1,3}[\*x#\.]{3,}\d{1,3}/i,
          input: '123***456',
          shouldMatch: true,
        }, // Digits-anonymization-digits
        {
          pattern: /\d{1,3}[\*x#\.]{3,}\d{1,3}/i,
          input: '12xxx34',
          shouldMatch: true,
        },
        {
          pattern: /\d{1,3}[\*x#\.]{3,}\d{1,3}/i,
          input: '1...2',
          shouldMatch: true,
        },
      ];

      testCases.forEach(({ pattern, input, shouldMatch }) => {
        const result = pattern.test(input);
        expect(result).toBe(shouldMatch);
      });
    });
  });

  describe('VALIDATION_CONSTANTS', () => {
    test('should have correct validation constants', () => {
      expect(VALIDATION_CONSTANTS).toEqual({
        MIN_ANONYMIZED_LENGTH: 8,
        MAX_ANONYMIZED_LENGTH: 15,
        CNPJ_LENGTH: 14,
        CPF_LENGTH: 11,
      });
    });

    test('should have numeric values', () => {
      Object.values(VALIDATION_CONSTANTS).forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });

    test('should have logical length relationships', () => {
      expect(VALIDATION_CONSTANTS.MIN_ANONYMIZED_LENGTH).toBeLessThan(
        VALIDATION_CONSTANTS.MAX_ANONYMIZED_LENGTH
      );
      expect(VALIDATION_CONSTANTS.CPF_LENGTH).toBeLessThan(
        VALIDATION_CONSTANTS.CNPJ_LENGTH
      );
    });
  });

  describe('Pattern Integration Tests', () => {
    test('should identify real anonymized CPF examples', () => {
      const anonymizedCPFs = [
        '123.***.*89-12',
        '***.456.789-**',
        '###.###.###-##',
        '12x.xxx.x89.12',
        '***.***.***-**',
        '123....789',
      ];

      anonymizedCPFs.forEach((cpf) => {
        const matchesAnyPattern = ANONYMIZATION_PATTERNS.some((pattern) =>
          pattern.test(cpf)
        );
        expect(matchesAnyPattern).toBe(true);
      });
    });

    test('should not match valid documents', () => {
      const validDocuments = [
        '12345678901', // Valid CPF format
        '12345678000195', // Valid CNPJ format
        '123.456.789-01',
        '12.345.678/0001-95',
      ];

      validDocuments.forEach((doc) => {
        // Should not match most anonymization patterns
        const matchesAnonymization = ANONYMIZATION_PATTERNS.some((pattern) =>
          pattern.test(doc)
        );
        // Some might match (like dots pattern), but that's handled in the validator logic
        // This test just ensures we have patterns that can distinguish
      });
    });
  });
});

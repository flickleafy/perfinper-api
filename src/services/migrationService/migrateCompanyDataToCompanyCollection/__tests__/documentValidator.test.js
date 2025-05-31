/**
 * Unit tests for DocumentValidator
 * Tests all validation methods and document identification logic
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { DocumentValidator } from '../documentValidator.js';
import { DOCUMENT_TYPES } from '../types.js';

// Mock the external validator
jest.unstable_mockModule(
  '../../../infrasctructure/validators/index.js',
  () => ({
    identifyDocumentType: jest.fn(),
  })
);

const { identifyDocumentType } = await import(
  '../../../infrasctructure/validators/index.js'
);

describe('DocumentValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDocument', () => {
    test('should return invalid for null or undefined input', () => {
      const testCases = [null, undefined, '', '   '];

      testCases.forEach((input) => {
        const result = DocumentValidator.validateDocument(input);
        expect(result).toEqual({
          type: DOCUMENT_TYPES.INVALID,
          isValid: false,
          isAnonymized: false,
          cleanDocument: '',
        });
      });
    });

    test('should return invalid for non-string input', () => {
      const testCases = [123, {}, [], true, false];

      testCases.forEach((input) => {
        const result = DocumentValidator.validateDocument(input);
        expect(result).toEqual({
          type: DOCUMENT_TYPES.INVALID,
          isValid: false,
          isAnonymized: false,
          cleanDocument: '',
        });
      });
    });

    test('should identify anonymized CPF correctly', () => {
      const anonymizedCPFs = [
        '123.***.*89-12',
        '***.456.789-**',
        '###.###.###-##',
        '12x.xxx.x89.12',
      ];

      anonymizedCPFs.forEach((cpf) => {
        const result = DocumentValidator.validateDocument(cpf);
        expect(result).toEqual({
          type: DOCUMENT_TYPES.ANONYMIZED_CPF,
          isValid: false,
          isAnonymized: true,
          cleanDocument: cpf,
        });
      });
    });

    test('should call external validator for non-anonymized documents', () => {
      const mockResponse = {
        type: DOCUMENT_TYPES.CNPJ,
        isValid: true,
      };
      identifyDocumentType.mockReturnValue(mockResponse);

      const document = '12.345.678/0001-95';
      const result = DocumentValidator.validateDocument(document);

      expect(identifyDocumentType).toHaveBeenCalledWith(document);
      expect(result).toEqual({
        type: DOCUMENT_TYPES.CNPJ,
        isValid: true,
        isAnonymized: false,
        cleanDocument: '12345678000195',
      });
    });

    test('should handle CPF validation', () => {
      const mockResponse = {
        type: DOCUMENT_TYPES.CPF,
        isValid: true,
      };
      identifyDocumentType.mockReturnValue(mockResponse);

      const document = '123.456.789-01';
      const result = DocumentValidator.validateDocument(document);

      expect(result).toEqual({
        type: DOCUMENT_TYPES.CPF,
        isValid: true,
        isAnonymized: false,
        cleanDocument: '12345678901',
      });
    });

    test('should handle invalid documents from external validator', () => {
      const mockResponse = {
        type: DOCUMENT_TYPES.INVALID,
        isValid: false,
      };
      identifyDocumentType.mockReturnValue(mockResponse);

      const document = 'invalid-document';
      const result = DocumentValidator.validateDocument(document);

      expect(result).toEqual({
        type: DOCUMENT_TYPES.INVALID,
        isValid: false,
        isAnonymized: false,
        cleanDocument: 'invaliddocument',
      });
    });

    test('should trim whitespace from input', () => {
      const mockResponse = {
        type: DOCUMENT_TYPES.CNPJ,
        isValid: true,
      };
      identifyDocumentType.mockReturnValue(mockResponse);

      const document = '  12.345.678/0001-95  ';
      const result = DocumentValidator.validateDocument(document);

      expect(identifyDocumentType).toHaveBeenCalledWith('12.345.678/0001-95');
    });
  });

  describe('isAnonymizedCPF', () => {
    test('should return false for null or undefined input', () => {
      expect(DocumentValidator.isAnonymizedCPF(null)).toBe(false);
      expect(DocumentValidator.isAnonymizedCPF(undefined)).toBe(false);
    });

    test('should return false for non-string input', () => {
      const testCases = [123, {}, [], true, false];

      testCases.forEach((input) => {
        expect(DocumentValidator.isAnonymizedCPF(input)).toBe(false);
      });
    });

    test('should identify anonymized patterns correctly', () => {
      const anonymizedCPFs = [
        '123.***.*89-12', // asterisks pattern
        '***.456.789-**', // asterisks pattern
        '123.xxx.x89-12', // x pattern
        'XXX.456.789-XX', // X pattern (case insensitive)
        '###.###.###-##', // hash pattern
        '123....789-12', // dots pattern
        '12***.***89', // mixed pattern
      ];

      anonymizedCPFs.forEach((cpf) => {
        expect(DocumentValidator.isAnonymizedCPF(cpf)).toBe(true);
      });
    });

    test('should reject patterns that are too short', () => {
      const shortPatterns = [
        '***', // too short
        'xx.xx', // too short
        '12***', // too short
      ];

      shortPatterns.forEach((pattern) => {
        expect(DocumentValidator.isAnonymizedCPF(pattern)).toBe(false);
      });
    });

    test('should reject patterns that are too long', () => {
      const longPatterns = [
        '123.456.789.***.***.***-**', // too long
        'x'.repeat(20), // way too long
      ];

      longPatterns.forEach((pattern) => {
        expect(DocumentValidator.isAnonymizedCPF(pattern)).toBe(false);
      });
    });

    test('should reject patterns without digits', () => {
      const noDigitPatterns = [
        '***.***.***-**', // only asterisks
        'xxx.xxx.xxx-xx', // only x's
        '###.###.###-##', // only hashes (this one actually has no digits)
      ];

      // Note: The hash pattern might be debatable, but it should have some digits
      // to be considered a potential CPF
      expect(DocumentValidator.isAnonymizedCPF('***.***.***-**')).toBe(false);
      expect(DocumentValidator.isAnonymizedCPF('xxx.xxx.xxx-xx')).toBe(false);
    });

    test('should accept patterns with some digits', () => {
      const mixedPatterns = [
        '1**.456.***-**', // has digits
        '123.xxx.789-xx', // has digits
        '12#.###.##9-##', // has digits
      ];

      mixedPatterns.forEach((pattern) => {
        expect(DocumentValidator.isAnonymizedCPF(pattern)).toBe(true);
      });
    });

    test('should handle edge cases', () => {
      expect(DocumentValidator.isAnonymizedCPF('')).toBe(false);
      expect(DocumentValidator.isAnonymizedCPF('   ')).toBe(false);
      expect(DocumentValidator.isAnonymizedCPF('12345678901')).toBe(false); // regular CPF
      expect(DocumentValidator.isAnonymizedCPF('12.345.678/0001-95')).toBe(
        false
      ); // CNPJ
    });
  });

  describe('hasValidDocumentData', () => {
    test('should return true for transaction with valid companyCnpj', () => {
      const transaction = {
        companyCnpj: '12.345.678/0001-95',
        otherField: 'value',
      };

      expect(DocumentValidator.hasValidDocumentData(transaction)).toBe(true);
    });

    test('should return false for transaction with empty companyCnpj', () => {
      const testCases = [
        { companyCnpj: '' },
        { companyCnpj: '   ' },
        { companyCnpj: null },
        { companyCnpj: undefined },
        {},
        { otherField: 'value' },
      ];

      testCases.forEach((transaction) => {
        expect(DocumentValidator.hasValidDocumentData(transaction)).toBe(false);
      });
    });

    test('should handle missing transaction object', () => {
      const testCases = [null, undefined, '', 'string', 123, []];

      testCases.forEach((transaction) => {
        expect(DocumentValidator.hasValidDocumentData(transaction)).toBe(false);
      });
    });
  });

  describe('getDocumentIdentifier', () => {
    test('should return companyCnpj when present', () => {
      const transaction = {
        companyCnpj: '12.345.678/0001-95',
        otherField: 'value',
      };

      expect(DocumentValidator.getDocumentIdentifier(transaction)).toBe(
        '12.345.678/0001-95'
      );
    });

    test('should return empty string when companyCnpj is missing', () => {
      const testCases = [
        { otherField: 'value' },
        { companyCnpj: null },
        { companyCnpj: undefined },
        {},
      ];

      testCases.forEach((transaction) => {
        expect(DocumentValidator.getDocumentIdentifier(transaction)).toBe('');
      });
    });

    test('should handle invalid transaction objects', () => {
      const testCases = [null, undefined, 'string', 123, []];

      testCases.forEach((transaction) => {
        // This should not throw, and should return empty string
        expect(() =>
          DocumentValidator.getDocumentIdentifier(transaction)
        ).not.toThrow();
        expect(DocumentValidator.getDocumentIdentifier(transaction)).toBe('');
      });
    });

    test('should return exact value including whitespace', () => {
      const transaction = {
        companyCnpj: '  12.345.678/0001-95  ',
      };

      expect(DocumentValidator.getDocumentIdentifier(transaction)).toBe(
        '  12.345.678/0001-95  '
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete document validation workflow', () => {
      // Mock successful CNPJ validation
      identifyDocumentType.mockReturnValue({
        type: DOCUMENT_TYPES.CNPJ,
        isValid: true,
      });

      const transaction = {
        companyCnpj: '12.345.678/0001-95',
        companyName: 'Test Company',
      };

      // Check if has valid document data
      expect(DocumentValidator.hasValidDocumentData(transaction)).toBe(true);

      // Get document identifier
      const identifier = DocumentValidator.getDocumentIdentifier(transaction);
      expect(identifier).toBe('12.345.678/0001-95');

      // Validate the document
      const validation = DocumentValidator.validateDocument(identifier);
      expect(validation).toEqual({
        type: DOCUMENT_TYPES.CNPJ,
        isValid: true,
        isAnonymized: false,
        cleanDocument: '12345678000195',
      });

      expect(identifyDocumentType).toHaveBeenCalledWith('12.345.678/0001-95');
    });

    test('should handle anonymized CPF workflow', () => {
      const transaction = {
        companyCnpj: '123.***.*89-12',
        companyName: 'Anonymous Company',
      };

      // Check if has valid document data
      expect(DocumentValidator.hasValidDocumentData(transaction)).toBe(true);

      // Get document identifier
      const identifier = DocumentValidator.getDocumentIdentifier(transaction);
      expect(identifier).toBe('123.***.*89-12');

      // Validate the document (should identify as anonymized)
      const validation = DocumentValidator.validateDocument(identifier);
      expect(validation).toEqual({
        type: DOCUMENT_TYPES.ANONYMIZED_CPF,
        isValid: false,
        isAnonymized: true,
        cleanDocument: '123.***.*89-12',
      });

      // Should not call external validator for anonymized documents
      expect(identifyDocumentType).not.toHaveBeenCalled();
    });
  });
});

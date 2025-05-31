/**
 * Document Validator
 * Handles validation and identification of different document types (CNPJ, CPF, anonymized CPF)
 * Follows Single Responsibility Principle - only handles document validation logic
 */

import { identifyDocumentType } from '../../../infrastructure/validators/index.js';
import {
  DOCUMENT_TYPES,
  ANONYMIZATION_PATTERNS,
  VALIDATION_CONSTANTS,
} from './types.js';

/**
 * Document Validator class
 * Centralizes all document validation and identification logic
 */
export class DocumentValidator {
  /**
   * Validates and identifies a document type
   * @param {string} document - Document string to validate
   * @returns {Object} Document information with type and validity
   */
  static validateDocument(document) {
    if (!document || typeof document !== 'string' || document.trim() === '') {
      return {
        type: DOCUMENT_TYPES.INVALID,
        isValid: false,
        isAnonymized: false,
        cleanDocument: '',
      };
    }

    const trimmedDocument = document.trim();

    // Check for anonymized CPF first
    if (this.isAnonymizedCPF(trimmedDocument)) {
      return {
        type: DOCUMENT_TYPES.ANONYMIZED_CPF,
        isValid: false, // Anonymized documents are not "valid" in traditional sense
        isAnonymized: true,
        cleanDocument: trimmedDocument,
      };
    }

    // Use existing validator for standard CNPJ/CPF validation
    const documentInfo = identifyDocumentType(trimmedDocument);

    return {
      type: documentInfo.type,
      isValid: documentInfo.isValid,
      isAnonymized: false,
      cleanDocument: trimmedDocument.replace(/\D/g, ''),
    };
  }

  /**
   * Checks if a document identifier could be an anonymized CPF
   * Common patterns: ***.123.456-**, 123.***.*89-**, etc.
   * @param {string} identifier - Document identifier to check
   * @returns {boolean} True if it looks like an anonymized CPF
   */
  static isAnonymizedCPF(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      return false;
    }

    const cleanIdentifier = identifier.replace(/\D/g, '');
    const originalIdentifier = identifier.trim();

    // Check if it matches anonymization patterns and has reasonable length
    const hasAnonymizationPattern = ANONYMIZATION_PATTERNS.some((pattern) =>
      pattern.test(originalIdentifier)
    );

    // Should have some structure suggesting it's a CPF (between 8-15 chars when including formatting)
    const hasReasonableLength =
      originalIdentifier.length >= VALIDATION_CONSTANTS.MIN_ANONYMIZED_LENGTH &&
      originalIdentifier.length <= VALIDATION_CONSTANTS.MAX_ANONYMIZED_LENGTH;

    // Should contain some digits
    const hasDigits = /\d/.test(originalIdentifier);

    return hasAnonymizationPattern && hasReasonableLength && hasDigits;
  }

  /**
   * Checks if transaction has valid company/person document data
   * @param {Object} transaction - Transaction to check
   * @returns {boolean} True if has valid document data
   */
  static hasValidDocumentData(transaction) {
    return !!(transaction.companyCnpj && transaction.companyCnpj.trim() !== '');
  }

  /**
   * Gets document identifier from transaction
   * @param {Object} transaction - Transaction with document data
   * @returns {string} Document identifier
   */
  static getDocumentIdentifier(transaction) {
    return transaction.companyCnpj || '';
  }
}

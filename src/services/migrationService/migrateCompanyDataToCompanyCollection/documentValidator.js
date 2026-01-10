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

    // Guard against undefined/null response from identifyDocumentType
    if (!documentInfo) {
      return {
        type: DOCUMENT_TYPES.INVALID,
        isValid: false,
        isAnonymized: false,
        cleanDocument: '',
      };
    }

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

    const originalIdentifier = identifier.trim();

    // Check if it matches anonymization patterns
    const hasAnonymizationPattern = ANONYMIZATION_PATTERNS.some((pattern) =>
      pattern.test(originalIdentifier)
    );

    // Should have some structure suggesting it's a CPF (between 8-15 chars)
    const hasReasonableLength =
      originalIdentifier.length >= VALIDATION_CONSTANTS.MIN_ANONYMIZED_LENGTH &&
      originalIdentifier.length <= VALIDATION_CONSTANTS.MAX_ANONYMIZED_LENGTH;

    // Must have at least one digit to be considered a potential CPF (even anonymized)
    // EXCEPTION: Allow full masking with hash like ###.###.###-## or asterisks if it matches exact pattern length
    const hasDigits = /\d/.test(originalIdentifier);
    const isFullMask = /^[#*xX\W]+$/.test(originalIdentifier);
    
    // If it's a full mask that matches length and structure, we accept it without digits
    if (!hasDigits && !isFullMask) {
      return false;
    }

    return hasAnonymizationPattern && hasReasonableLength;
  }

  /**
   * Checks if transaction has valid company/person document data
   * @param {Object} transaction - Transaction to check
   * @returns {boolean} True if has valid document data
   */
  static hasValidDocumentData(transaction) {
    if (!transaction) return false;
    return !!(transaction.companyCnpj && transaction.companyCnpj.trim() !== '');
  }

  /**
   * Gets the document identifier from transaction
   * @param {Object} transaction - Transaction object
   * @returns {string} Document identifier or empty string
   */
  static getDocumentIdentifier(transaction) {
    if (!transaction) return '';
    return transaction.companyCnpj || '';
  }
}

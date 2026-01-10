/**
 * Types and constants for migration service
 * Defines the core data structures and enums used across the migration system
 */

/**
 * Document types supported by the migration system
 */
export const DOCUMENT_TYPES = {
  CNPJ: 'cnpj',
  CPF: 'cpf',
  INVALID: 'invalid',
  ANONYMIZED_CPF: 'anonymized_cpf',
};

/**
 * Entity statuses
 */
export const ENTITY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  ANONYMOUS: 'anonymous',
};

/**
 * Processing result structure
 * @typedef {Object} ProcessingResult
 * @property {number} created - Number of entities created
 * @property {number} skipped - Number of entities skipped
 * @property {number} updated - Number of transactions updated
 */

/**
 * Dry-run entity data structure
 * @typedef {Object} DryRunEntity
 * @property {string} identifier - Entity identifier (CNPJ/CPF)
 * @property {string} name - Entity name
 * @property {string} type - Entity type (company/person/anonymous)
 * @property {Object} data - Complete entity data that would be created
 * @property {string} source - Source transaction information
 */

/**
 * Enhanced statistics for dry-run mode
 * @typedef {Object} DryRunStats
 * @property {boolean} isDryRun - Whether this was a dry-run execution
 * @property {number} transactionsAnalyzed - Total transactions processed
 * @property {Array<DryRunEntity>} cnpjRecords - Companies that would be created
 * @property {Array<DryRunEntity>} cpfRecords - Persons that would be created
 * @property {Array<DryRunEntity>} anonymousCpfRecords - Anonymous persons that would be created
 * @property {Array<Object>} failedRecords - Transactions that failed processing
 * @property {Array<Object>} existingEntities - Entities that already exist
 * @property {number} companiesWouldCreate - Companies that would be created count
 * @property {number} personsWouldCreate - Persons that would be created count
 * @property {number} anonymousPersonsWouldCreate - Anonymous persons that would be created count
 * @property {number} companiesExisting - Existing companies count
 * @property {number} personsExisting - Existing persons count
 * @property {number} transactionsWouldUpdate - Transactions that would be updated
 * @property {number} uniqueEntitiesProcessed - Total unique entities processed
 */

/**
 * Migration statistics structure
 * @typedef {Object} MigrationStats
 * @property {boolean} success - Whether migration completed successfully
 * @property {number} transactionsAnalyzed - Total transactions processed
 * @property {number} companiesCreated - Companies created
 * @property {number} companiesUpdated - Companies updated
 * @property {number} companiesSkipped - Companies skipped
 * @property {number} personsCreated - Persons created
 * @property {number} personsUpdated - Persons updated
 * @property {number} personsSkipped - Persons skipped
 * @property {number} anonymousPersonsCreated - Anonymous persons created
 * @property {number} uniqueEntitiesProcessed - Total unique entities processed
 */

/**
 * Document validation result structure
 * @typedef {Object} DocumentInfo
 * @property {string} type - Document type (CNPJ, CPF, etc.)
 * @property {boolean} isValid - Whether document is valid
 * @property {boolean} isAnonymized - Whether document is anonymized
 * @property {string} cleanDocument - Document with formatting removed
 */

/**
 * Default processing result
 */
export const EMPTY_RESULT = {
  created: 0,
  skipped: 0,
  updated: 0,
};

/**
 * Anonymization patterns for CPF detection
 */
export const ANONYMIZATION_PATTERNS = [
  /\*{3,}/, // Three or more asterisks
  /x{3,}/i, // Three or more x's (case insensitive)
  /##+/, // Hash symbols
  /\.{3,}/, // Multiple dots beyond normal CPF formatting
  /\d{1,3}[\*x#\.]{3,}\d{1,3}/i, // Digits-anonymization-digits pattern
  /•{3}\.\d{3}\.\d{3}-•{2}/, // Pattern like •••.123.456-••
];

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
  MIN_ANONYMIZED_LENGTH: 8,
  MAX_ANONYMIZED_LENGTH: 15,
  CNPJ_LENGTH: 14,
  CPF_LENGTH: 11,
};

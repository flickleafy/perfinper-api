/**
 * Migration Service Orchestrator
 * Main entry point for company and person data migration
 * Coordinates all processors and follows the Strategy pattern for different document types
 *
 * Architecture:
 * - DocumentValidator: Validates and identifies document types
 * - CompanyProcessor: Handles CNPJ/company processing
 * - PersonProcessor: Handles CPF/person processing
 * - AnonymousPersonProcessor: Handles anonymized CPF processing
 * - EntityAdapters: Transform transaction data to entity objects (Factory pattern)
 * - TransactionUpdater: Updates transactions with entity references
 */

import mongoose from 'mongoose';
import { findAllWithCompanyCnpj as findAllTransactionsWithCompany } from '../../../repository/transactionRepository.js';
import { DocumentValidator } from './documentValidator.js';
import { CompanyProcessor } from './companyProcessor.js';
import { PersonProcessor } from './personProcessor.js';
import { AnonymousPersonProcessor } from './anonymousPersonProcessor.js';
import { DOCUMENT_TYPES } from './types.js';
import {
  createDryRunStats,
  displayDryRunStatistics,
  generateDryRunReport,
} from './dryRunUtils.js';

/**
 * Migrates company and person data from transactions to their respective collections
 * Extracts unique companies (CNPJ) and persons (CPF) based on document identifiers
 * Prevents duplicates and enriches entity data over time
 * Uses MongoDB transactions to ensure data consistency
 * @param {boolean} dryRun - Whether to run in dry-run mode (no actual changes)
 * @returns {Object} Migration statistics or dry-run report
 */
export async function migrateCompanyDataToCompanyCollection(dryRun = false) {
  const session = await mongoose.startSession();

  try {
    if (dryRun) {
      console.log(
        '🧪 Starting DRY RUN analysis of company and person data migration from transactions with CNPJ/CPF...'
      );
    } else {
      console.log(
        '🏢 Starting company and person data migration from transactions with CNPJ/CPF...'
      );
    }

    const transactions = await findAllTransactionsWithCompany();
    console.log(
      `📊 Found ${transactions.length} transactions with CNPJ/CPF to analyze`
    );

    if (transactions.length === 0) {
      console.log('ℹ️ No transactions found. Migration completed.');
      const emptyResult = {
        success: true,
        transactionsAnalyzed: 0,
        companiesCreated: 0,
        companiesUpdated: 0,
        personsCreated: 0,
        personsUpdated: 0,
        anonymousPersonsCreated: 0,
        anonymousPersonsUpdated: 0,
        uniqueEntitiesProcessed: 0,
      };

      if (dryRun) {
        return { ...emptyResult, isDryRun: true };
      }
      return emptyResult;
    }

    // Handle dry-run mode
    if (dryRun) {
      const dryRunStats = createDryRunStats();
      dryRunStats.transactionsAnalyzed = transactions.length;

      const migrationResult = await processTransactionsWithSession(
        transactions,
        session,
        dryRun,
        dryRunStats
      );

      // Display comprehensive dry-run statistics
      displayDryRunStatistics(dryRunStats);

      // Return detailed report
      return generateDryRunReport(dryRunStats);
    }

    // Regular migration mode with MongoDB transaction
    let migrationResult;
    await session.withTransaction(async () => {
      migrationResult = await processTransactionsWithSession(
        transactions,
        session,
        dryRun
      );
    });

    console.log('🎉 Company and person data migration completed!');
    console.log(`📈 Summary:`, migrationResult);

    return migrationResult;
  } catch (error) {
    console.error('💥 Error during company and person data migration:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Processes all transactions to extract and create companies/persons with MongoDB session
 * @param {Array} transactions - Array of transactions to process
 * @param {Object} session - MongoDB session for transaction
 * @param {boolean} dryRun - Whether this is a dry-run execution
 * @param {Object} dryRunStats - Statistics collector for dry-run mode
 * @returns {Object} Migration summary with counts and statistics
 */
async function processTransactionsWithSession(
  transactions,
  session,
  dryRun = false,
  dryRunStats = null
) {
  const processedEntities = new Map();
  const stats = {
    success: true,
    transactionsAnalyzed: transactions.length,
    companiesCreated: 0,
    companiesUpdated: 0,
    personsCreated: 0,
    personsUpdated: 0,
    anonymousPersonsCreated: 0,
    anonymousPersonsUpdated: 0,
    uniqueEntitiesProcessed: 0,
  };

  // Initialize document validator (uses static methods)
  for (const transaction of transactions) {
    try {
      const result = await processTransactionWithSession(
        transaction,
        processedEntities,
        session,
        dryRun,
        dryRunStats
      );

      // Update statistics based on result type
      if (result.entityType === DOCUMENT_TYPES.CNPJ) {
        stats.companiesCreated += result.created;
        stats.companiesUpdated += result.updated;
      } else if (result.entityType === DOCUMENT_TYPES.CPF) {
        stats.personsCreated += result.created;
        stats.personsUpdated += result.updated;
      } else if (result.entityType === DOCUMENT_TYPES.ANONYMOUS_CPF) {
        stats.anonymousPersonsCreated += result.created;
        stats.anonymousPersonsUpdated += result.updated;
      }
    } catch (error) {
      console.error(
        `❌ Error processing transaction ${transaction.id}:`,
        error.message
      );
      throw error; // Rethrow to trigger transaction rollback
    }
  }

  stats.uniqueEntitiesProcessed = processedEntities.size;

  // Update dry-run stats if provided
  if (dryRun && dryRunStats) {
    dryRunStats.uniqueEntitiesProcessed = processedEntities.size;
  }

  return stats;
}

/**
 * Processes a single transaction to extract company or person data with MongoDB session
 * @param {Object} transaction - Transaction to process
 * @param {Map} processedEntities - Map of already processed entities (companies/persons)
 * @param {Object} session - MongoDB session for transaction
 * @param {boolean} dryRun - Whether this is a dry-run execution
 * @param {Object} dryRunStats - Statistics collector for dry-run mode
 * @returns {Object} Result with created/updated counts and entity type
 */
async function processTransactionWithSession(
  transaction,
  processedEntities,
  session,
  dryRun = false,
  dryRunStats = null
) {
  // Skip transactions without company data
  if (!hasCompanyData(transaction)) {
    return { created: 0, updated: 0, entityType: null };
  }

  const entityIdentifier = getEntityIdentifier(transaction);

  // Skip if already processed in this migration
  if (processedEntities.has(entityIdentifier)) {
    return { created: 0, updated: 0, entityType: null };
  }

  // Validate and identify document type using the validator
  const documentInfo = DocumentValidator.validateDocument(entityIdentifier);

  // Handle invalid documents (check for anonymized CPF first)
  if (!documentInfo.isValid) {
    return await handleInvalidDocument(
      entityIdentifier,
      transaction,
      processedEntities,
      session,
      dryRun,
      dryRunStats
    );
  }

  // Process valid documents based on type
  return await processValidDocument(
    documentInfo,
    transaction,
    processedEntities,
    session,
    dryRun,
    dryRunStats
  );
}

/**
 * Handles invalid document identifiers (potentially anonymized CPF)
 */
async function handleInvalidDocument(
  entityIdentifier,
  transaction,
  processedEntities,
  session,
  dryRun = false,
  dryRunStats = null
) {
  // Check if it could be an anonymized CPF
  if (DocumentValidator.isAnonymizedCPF(entityIdentifier)) {
    console.log(`🔒 Processing anonymized CPF: ${entityIdentifier}`);
    const result = await AnonymousPersonProcessor.process(
      transaction,
      processedEntities,
      session,
      dryRun,
      dryRunStats
    );

    return { ...result, entityType: DOCUMENT_TYPES.ANONYMOUS_CPF };
  }

  console.log(`⚠️ Invalid document identifier: ${entityIdentifier}`);
  console.log('📄 Transaction record with invalid identifier:');
  console.log(JSON.stringify(transaction, null, 2)); // Formatted output
  return { created: 0, updated: 0, entityType: null };
}

/**
 * Processes valid documents based on their type
 */
async function processValidDocument(
  documentInfo,
  transaction,
  processedEntities,
  session,
  dryRun = false,
  dryRunStats = null
) {
  let result;
  let entityType;

  if (documentInfo.type === DOCUMENT_TYPES.CNPJ) {
    result = await CompanyProcessor.process(
      transaction,
      processedEntities,
      session,
      dryRun,
      dryRunStats
    );
    entityType = DOCUMENT_TYPES.CNPJ;
  } else if (documentInfo.type === DOCUMENT_TYPES.CPF) {
    result = await PersonProcessor.process(
      transaction,
      processedEntities,
      session,
      dryRun,
      dryRunStats
    );
    entityType = DOCUMENT_TYPES.CPF;
  } else {
    return { created: 0, updated: 0, entityType: null };
  }

  return { ...result, entityType };
}

/**
 * Checks if transaction has company CNPJ/CPF data
 * @param {Object} transaction - Transaction to check
 * @returns {boolean} True if has company CNPJ/CPF
 */
function hasCompanyData(transaction) {
  return !!(transaction.companyCnpj && transaction.companyCnpj.trim() !== '');
}

/**
 * Gets unique identifier for an entity (company/person) from transaction
 * @param {Object} transaction - Transaction with company CNPJ/CPF data
 * @returns {string} Unique entity identifier (CNPJ/CPF)
 */
function getEntityIdentifier(transaction) {
  return transaction.companyCnpj;
}

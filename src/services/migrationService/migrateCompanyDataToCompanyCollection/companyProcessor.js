/**
 * Company Processor
 * Handles all company-related processing for CNPJ documents
 * Follows Single Responsibility Principle - only handles company domain logic
 */

import {
  findByCnpj,
  insert as insertCompany,
} from '../../../repository/companyRepository.js';
import { CompanyAdapter } from './entityAdapters.js';
import { TransactionUpdater } from './transactionUpdater.js';
import { EMPTY_RESULT } from './types.js';
import {
  addExistingEntity,
  incrementTransactionUpdates,
  addCnpjRecord,
  addFailedRecord,
} from './dryRunUtils.js';

/**
 * Company Processor class
 * Manages all company-specific operations during migration
 */
export class CompanyProcessor {
  /**
   * Processes a company transaction (CNPJ)
   * @param {Object} transaction - Transaction to process
   * @param {Map} processedEntities - Map of already processed entities
   * @param {Object} session - MongoDB session for transaction
   * @param {boolean} dryRun - Whether this is a dry-run execution
   * @param {Object} dryRunStats - Statistics collector for dry-run mode
   * @returns {Object} Result with created/skipped/updated counts
   */
  static async process(
    transaction,
    processedEntities,
    session,
    dryRun = false,
    dryRunStats = null
  ) {
    const companyIdentifier = transaction.companyCnpj;

    try {
      // Check if company already exists
      const existingCompany = await this.findExisting(transaction, session);

      if (existingCompany) {
        console.log(
          `✅ Company already exists: ${
            existingCompany.corporateName || existingCompany.tradeName
          }`
        );

        // Track existing entity for dry-run
        if (dryRun && dryRunStats) {
          addExistingEntity(
            dryRunStats,
            companyIdentifier,
            existingCompany,
            'company'
          );
          incrementTransactionUpdates(dryRunStats);
        }

        // Update transaction with companyId if not already set (skip in dry-run)
        let updateResult = false;
        if (!dryRun) {
          updateResult = await TransactionUpdater.updateWithCompanyId(
            transaction,
            existingCompany.id,
            session
          );
        } else {
          updateResult = true; // Simulate successful update
        }

        processedEntities.set(companyIdentifier, true);
        return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
      }

      // Create new company
      const newCompanyData = CompanyAdapter.fromTransaction(transaction);
      if (newCompanyData) {
        if (dryRun) {
          // Dry-run mode: just collect statistics
          console.log(
            `🧪 Would create company: ${
              newCompanyData.corporateName || newCompanyData.tradeName
            }`
          );

          if (dryRunStats) {
            addCnpjRecord(
              dryRunStats,
              companyIdentifier,
              newCompanyData,
              transaction
            );
            incrementTransactionUpdates(dryRunStats);
          }
        } else {
          // Regular mode: actually create the company
          const createdCompany = await this.create(newCompanyData, session);
          console.log(
            `🆕 Created company: ${
              newCompanyData.corporateName || newCompanyData.tradeName
            }`
          );

          // Update transaction with the new companyId
          await TransactionUpdater.updateWithCompanyId(
            transaction,
            createdCompany.id,
            session
          );
        }

        processedEntities.set(companyIdentifier, true);
        return { created: 1, skipped: 0, updated: 1 };
      }

      return EMPTY_RESULT;
    } catch (error) {
      console.error(`❌ Error processing company transaction:`, error.message);

      // Track failed record for dry-run
      if (dryRun && dryRunStats) {
        addFailedRecord(dryRunStats, transaction, error.message);
      }

      throw error;
    }
  }

  /**
   * Finds existing company in database by CNPJ
   * @param {Object} transaction - Transaction with company CNPJ data
   * @param {Object} session - MongoDB session
   * @returns {Object|null} Existing company or null
   */
  static async findExisting(transaction, session) {
    if (transaction.companyCnpj) {
      return await findByCnpj(transaction.companyCnpj, session);
    }
    return null;
  }

  /**
   * Creates a new company with session support
   * @param {Object} companyData - Company data to insert
   * @param {Object} session - MongoDB session
   * @returns {Object} Created company
   */
  static async create(companyData, session) {
    return await insertCompany(companyData, session);
  }
}

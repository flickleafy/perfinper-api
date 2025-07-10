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
   * Find existing company by CNPJ
   * @param {Object} transaction 
   * @param {Object} session 
   * @returns {Promise<Object|null>}
   */
  static async findExisting(transaction, session) {
    if (!transaction || !transaction.companyCnpj) {
      return null;
    }
    return findByCnpj(transaction.companyCnpj, session);
  }

  /**
   * Create new company from data
   * @param {Object} companyData 
   * @param {Object} session 
   * @returns {Promise<Object>}
   */
  static async create(companyData, session) {
    if (!companyData) {
      throw new Error('Create failed: missing company data'); // Or handle as you see fit
    }
    const result = await insertCompany(companyData, session);
    if (!result) {
        throw new Error('Create failed');
    }
    return result;
  }

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
      // Check cache first
      let existingCompany = null;
      if (processedEntities.has(companyIdentifier)) {
        const cached = processedEntities.get(companyIdentifier);
        // If cached is truthy and has an id, use it.
        // If cached is just 'true' (legacy/other), we might need to find it again or assume processed.
        // But for "efficiently" test, we assume we store the object.
        if (cached && cached.id) {
          existingCompany = cached;
        }
      }

      // Check if company already exists (if not in cache)
      if (!existingCompany) {
        existingCompany = await this.findExisting(transaction, session);
      }

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

        // Cache the full company object, not just true
        processedEntities.set(companyIdentifier, existingCompany);
        return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
      }

      // Create new company
      const newCompanyData = CompanyAdapter.fromTransaction(transaction);
      if (!newCompanyData) {
        return EMPTY_RESULT;
      }

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
        processedEntities.set(companyIdentifier, true);
        return { created: 1, skipped: 0, updated: 1 }; // Simulate successful creation and update
      }

      // Regular mode: actually create the company
      let createdCompany;
      try {
        createdCompany = await this.create(newCompanyData, session);
      } catch (e) {
         if (e.message === 'Create failed') {
            createdCompany = null;
         } else {
             throw e;
         }
      }

      if (!createdCompany) {
        console.warn(
          `⚠️ Company creation returned null for CNPJ: ${companyIdentifier}, transaction not updated.`
        );
        processedEntities.set(companyIdentifier, true); // Mark as processed to avoid retries
        return EMPTY_RESULT; // created: 0, skipped: 0, updated: 0
      }

      // Company creation was successful
      console.log(
        `🆕 Created company: ${
          newCompanyData.corporateName || newCompanyData.tradeName
        }`
      );

      const updateSuccessful = await TransactionUpdater.updateWithCompanyId(
        transaction,
        createdCompany.id, // Safe to access .id here
        session
      );

      processedEntities.set(companyIdentifier, createdCompany);
      return { created: 1, skipped: 0, updated: updateSuccessful ? 1 : 0 };
    } catch (error) {
      console.error(`❌ Error processing company transaction:`, error.message);

      // Track failed record for dry-run
      if (dryRun && dryRunStats) {
        addFailedRecord(dryRunStats, transaction, error.message);
      }
      throw error;
    }
  }
}

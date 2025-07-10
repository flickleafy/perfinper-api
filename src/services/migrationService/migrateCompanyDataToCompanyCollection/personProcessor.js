/**
 * Person Processor
 * Handles all person-related processing for CPF documents
 * Follows Single Responsibility Principle - only handles person domain logic
 */

import {
  findByCpf,
  insert as insertPerson,
} from '../../../repository/personRepository.js';
import { PersonAdapter } from './entityAdapters.js';
import { TransactionUpdater } from './transactionUpdater.js';
import { EMPTY_RESULT } from './types.js';

/**
 * Person Processor class
 * Manages all person-specific operations during migration
 */
export class PersonProcessor {
  /**
   * Processes a person transaction (CPF)
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
    const personIdentifier = transaction.companyCnpj;

    try {
      // Check if person already exists
      const existingPerson = await this.findExisting(transaction, session);

      if (existingPerson) {
        console.log(`✅ Person already exists: ${existingPerson.fullName}`);

        // Track existing entity for dry-run
        if (dryRun && dryRunStats) {
          const { addExistingEntity, incrementTransactionUpdates } =
            await import('./dryRunUtils.js');
          addExistingEntity(
            dryRunStats,
            personIdentifier,
            existingPerson,
            'person'
          );
          incrementTransactionUpdates(dryRunStats);
        }

        // Update transaction with personId if not already set (skip in dry-run)
        let updateResult = false;
        if (!dryRun) {
          updateResult = await TransactionUpdater.updateWithPersonId(
            transaction,
            existingPerson.id,
            session
          );
        } else {
          updateResult = true; // Simulate successful update
        }

        processedEntities.set(personIdentifier, true);
        return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
      }

      // Create new person
      const newPersonData = PersonAdapter.fromTransaction(transaction);
      if (newPersonData) {
        if (dryRun) {
          // Dry-run mode: just collect statistics
          console.log(`🧪 Would create person: ${newPersonData.fullName}`);

          if (dryRunStats) {
            const { addCpfRecord, incrementTransactionUpdates } = await import(
              './dryRunUtils.js'
            );
            addCpfRecord(
              dryRunStats,
              personIdentifier,
              newPersonData,
              transaction
            );
            incrementTransactionUpdates(dryRunStats);
          }
        } else {
          // Regular mode: actually create the person
          const createdPerson = await this.create(newPersonData, session);
          console.log(`🆕 Created person: ${newPersonData.fullName}`);

          // Update transaction with the new personId
          const updateResult = await TransactionUpdater.updateWithPersonId(
            transaction,
            createdPerson.id,
            session
          );

          if (!updateResult) {
            console.warn(
              `⚠️ Transaction update failed for Created Person: ${createdPerson.id}`
            );
          }

          processedEntities.set(personIdentifier, true);
          return { created: 1, skipped: 0, updated: updateResult ? 1 : 0 };
        }

        processedEntities.set(personIdentifier, true);
        return { created: 1, skipped: 0, updated: 1 }; // Fallback if regular mode logic changes
      }

      return EMPTY_RESULT;
    } catch (error) {
      console.error(`❌ Error processing person transaction:`, error.message);

      // Track failed record for dry-run
      if (dryRun && dryRunStats) {
        const { addFailedRecord } = await import('./dryRunUtils.js');
        addFailedRecord(dryRunStats, transaction, error.message);
      }

      throw error;
    }
  }

  /**
   * Finds existing person in database by CPF
   * @param {Object} transaction - Transaction with person CPF data
   * @param {Object} session - MongoDB session
   * @returns {Object|null} Existing person or null
   */
  static async findExisting(transaction, session) {
    if (transaction.companyCnpj) {
      return await findByCpf(transaction.companyCnpj, session);
    }
    return null;
  }

  /**
   * Creates a new person with session support
   * @param {Object} personData - Person data to insert
   * @param {Object} session - MongoDB session
   * @returns {Object} Created person
   */
  static async create(personData, session) {
    return await insertPerson(personData, session);
  }
}

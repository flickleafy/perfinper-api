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
   * @returns {Object} Result with created/skipped/updated counts
   */
  static async process(transaction, processedEntities, session) {
    const personIdentifier = transaction.companyCnpj;

    try {
      // Check if person already exists
      const existingPerson = await this.findExisting(transaction, session);

      if (existingPerson) {
        console.log(`✅ Person already exists: ${existingPerson.fullName}`);

        // Update transaction with personId if not already set
        const updateResult = await TransactionUpdater.updateWithPersonId(
          transaction,
          existingPerson.id,
          session
        );

        processedEntities.set(personIdentifier, true);
        return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
      }

      // Create new person
      const newPersonData = PersonAdapter.fromTransaction(transaction);
      if (newPersonData) {
        const createdPerson = await this.create(newPersonData, session);
        console.log(`🆕 Created person: ${newPersonData.fullName}`);

        // Update transaction with the new personId
        const updateResult = await TransactionUpdater.updateWithPersonId(
          transaction,
          createdPerson.id,
          session
        );

        processedEntities.set(personIdentifier, true);
        return { created: 1, skipped: 0, updated: updateResult ? 1 : 0 };
      }

      return EMPTY_RESULT;
    } catch (error) {
      console.error(`❌ Error processing person transaction:`, error.message);
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

/**
 * Anonymous Person Processor
 * Handles all anonymous person-related processing for anonymized CPF documents
 * Follows Single Responsibility Principle - only handles anonymous person domain logic
 */

import {
  findByCpf,
  insert as insertPerson,
} from '../../../repository/personRepository.js';
import { AnonymousPersonAdapter } from './entityAdapters.js';
import { TransactionUpdater } from './transactionUpdater.js';
import { EMPTY_RESULT } from './types.js';

/**
 * Anonymous Person Processor class
 * Manages all anonymous person-specific operations during migration
 */
export class AnonymousPersonProcessor {
  /**
   * Processes an anonymous person transaction (anonymized CPF)
   * @param {Object} transaction - Transaction to process
   * @param {Map} processedEntities - Map of already processed entities
   * @param {Object} session - MongoDB session for transaction
   * @returns {Object} Result with created/skipped/updated counts
   */
  static async process(transaction, processedEntities, session) {
    const personIdentifier = transaction.companyCnpj;

    try {
      // Check if anonymous person already exists
      const existingPerson = await this.findExisting(transaction, session);

      if (existingPerson) {
        console.log(
          `✅ Anonymous person already exists: ${existingPerson.fullName}`
        );

        // Update transaction with personId if not already set
        const updateResult =
          await TransactionUpdater.updateWithAnonymousPersonId(
            transaction,
            existingPerson.id,
            session
          );

        processedEntities.set(personIdentifier, true);
        return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
      }

      // Create new anonymous person
      const newPersonData = AnonymousPersonAdapter.fromTransaction(transaction);
      if (newPersonData) {
        const createdPerson = await this.create(newPersonData, session);
        console.log(`🆕 Created anonymous person: ${newPersonData.fullName}`);

        // Update transaction with the new personId
        const updateResult =
          await TransactionUpdater.updateWithAnonymousPersonId(
            transaction,
            createdPerson.id,
            session
          );

        processedEntities.set(personIdentifier, true);
        return { created: 1, skipped: 0, updated: updateResult ? 1 : 0 };
      }

      return EMPTY_RESULT;
    } catch (error) {
      console.error(
        `❌ Error processing anonymous person transaction:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Finds existing anonymous person by anonymized identifier
   * @param {Object} transaction - Transaction with anonymized CPF data
   * @param {Object} session - MongoDB session
   * @returns {Object|null} Existing anonymous person or null
   */
  static async findExisting(transaction, session) {
    if (transaction.companyCnpj) {
      // For anonymous persons, we search by the anonymized CPF directly
      return await findByCpf(transaction.companyCnpj, session);
    }
    return null;
  }

  /**
   * Creates a new anonymous person with session support
   * @param {Object} personData - Anonymous person data to insert
   * @param {Object} session - MongoDB session
   * @returns {Object} Created anonymous person
   */
  static async create(personData, session) {
    return await insertPerson(personData, session);
  }
}

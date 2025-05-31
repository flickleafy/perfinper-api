/**
 * Transaction Updater
 * Handles updating transactions with entity references and cleanup
 * Follows Single Responsibility Principle - only handles transaction updates
 */

import { updateById as updateTransaction } from '../../../repository/transactionRepository.js';

/**
 * Transaction Updater class
 * Manages all transaction update operations for the migration process
 */
export class TransactionUpdater {
  /**
   * Updates transaction with company ID and removes redundant fields
   * @param {Object} transaction - Transaction to update
   * @param {string} companyId - Company ID to link
   * @param {Object} session - MongoDB session
   * @returns {boolean} True if updated, false if skipped
   */
  static async updateWithCompanyId(transaction, companyId, session) {
    try {
      // Only update if companyId is not already set
      if (!transaction.companyId) {
        const updateData = {
          companyId,
          // Remove redundant company fields now that we have a reference
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        };

        await updateTransaction(transaction.id, updateData, session);
        console.log(
          `🔗 Updated transaction ${transaction.id} with companyId: ${companyId} and removed redundant company fields`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `❌ Error updating transaction ${transaction.id} with companyId:`,
        error.message
      );
      throw error; // Rethrow to trigger transaction rollback
    }
  }

  /**
   * Updates transaction with person ID and removes redundant fields
   * @param {Object} transaction - Transaction to update
   * @param {string} personId - Person ID to link
   * @param {Object} session - MongoDB session
   * @returns {boolean} True if updated, false if skipped
   */
  static async updateWithPersonId(transaction, personId, session) {
    try {
      // Only update if personId is not already set (using companyId field for now)
      if (!transaction.companyId) {
        const updateData = {
          companyId: personId, // Using same field for simplicity
          // Remove redundant company fields now that we have a reference
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        };

        await updateTransaction(transaction.id, updateData, session);
        console.log(
          `🔗 Updated transaction ${transaction.id} with personId: ${personId} and removed redundant company fields`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `❌ Error updating transaction ${transaction.id} with personId:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Updates transaction with anonymous person ID
   * @param {Object} transaction - Transaction to update
   * @param {string} anonymousPersonId - Anonymous person ID to link
   * @param {Object} session - MongoDB session
   * @returns {boolean} True if updated, false if skipped
   */
  static async updateWithAnonymousPersonId(
    transaction,
    anonymousPersonId,
    session
  ) {
    // Reuse person update logic since the structure is the same
    return this.updateWithPersonId(transaction, anonymousPersonId, session);
  }
}

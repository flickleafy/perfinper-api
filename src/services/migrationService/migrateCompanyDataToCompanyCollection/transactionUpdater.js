/**
 * Transaction Updater
 * Handles updating transactions with entity references and cleanup
 * Follows Single Responsibility Principle - only handles transaction updates
 */

import { updateById as updateTransaction } from '../../../repository/transactionRepository.js';
import mongoose from 'mongoose';

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
      // Ensure transaction has id property for consistency (MongoDB uses _id)
      const transactionId =
        transaction.id || (transaction._id ? transaction._id.toString() : null);

      if (!transactionId) {
        console.log(`⚠️ Cannot update transaction - missing ID`);
        return false;
      }

      // Check if transaction already has a companyId set
      if (transaction.companyId) {
        // Log skipped message (optional, but good for debugging)
        // console.log(`⚠️ Skipped updating transaction ${transactionId} - companyId already set: ${transaction.companyId}`);
        return false;
      }

      // Check if provided companyId is valid MongoDB ObjectId
      if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
        const updateData = {
          companyId,
          // Remove redundant company fields now that we have a reference
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        };

        await updateTransaction(transactionId, updateData, session);
        console.log(
          `🔗 Updated transaction ${transactionId} with companyId: ${companyId} and removed redundant company fields`
        );
        return true;
      }
      console.log(
        `⚠️ Skipped updating transaction ${transactionId} - invalid companyId provided: ${companyId}`
      );
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
      // Ensure transaction has id property for consistency (MongoDB uses _id)
      const transactionId =
        transaction.id || (transaction._id ? transaction._id.toString() : null);

      if (!transactionId) {
        console.log(`⚠️ Cannot update transaction - missing ID`);
        return false;
      }

      // Check if transaction already has a companyId set (or personId/anonymousPersonId which use the same field)
      if (transaction.companyId) {
        return false;
      }

      // Check if provided personId is valid MongoDB ObjectId
      if (personId && mongoose.Types.ObjectId.isValid(personId)) {
        const updateData = {
          companyId: personId, // Using same field for simplicity
          // Remove redundant company fields now that we have a reference
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        };

        await updateTransaction(transactionId, updateData, session);
        console.log(
          `🔗 Updated transaction ${transactionId} with personId: ${personId} and removed redundant company fields`
        );
        return true;
      }
      console.log(
        `⚠️ Skipped updating transaction ${transactionId} - invalid personId provided: ${personId}`
      );
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

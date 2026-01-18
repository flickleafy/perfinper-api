import * as fiscalBookRepository from '../repository/fiscalBookRepository.js';
import * as transactionRepository from '../repository/transactionRepository.js';
import * as snapshotSchedulerService from './snapshotSchedulerService.js';
import mongoose from 'mongoose';
import TransactionModel from '../models/TransactionModel.js';

import validator from '../infrastructure/validators/fiscalBookValidator.js';

/**
 * Create a new fiscal book
 * @param {Object} fiscalBookData - Data for the new fiscal book
 * @returns {Promise<Object>} Created fiscal book
 */
export async function createFiscalBook(fiscalBookData) {
  // Validate fiscal book data
  const validation = validator.validateFiscalBookData(fiscalBookData);
  if (!validation.isValid) {
    throw new Error(
      `Invalid fiscal book data: ${validation.errors.join(', ')}`
    );
  }

  return await fiscalBookRepository.insert(fiscalBookData);
}

/**
 * Get all fiscal books with optional filtering
 * Includes transaction count and financial summary for each book
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options (pagination, sorting)
 * @returns {Promise<Array>} List of fiscal books with statistics
 */
export async function getAllFiscalBooks(filter = {}, options = {}) {
  // Get all fiscal books using standard query
  const books = await fiscalBookRepository.findAll(filter, options);
  
  // Add transaction count and financial summary for each book
  const booksWithStats = await Promise.all(
    books.map(async (book) => {
      const bookObj = book.toObject ? book.toObject() : book;
      const bookId = book._id || book.id;
      
      // Get transactions for this book
      const transactions = await transactionRepository.findByFiscalBookId(bookId);
      
      // Compute financial summary
      let totalIncome = 0;
      let totalExpenses = 0;
      
      transactions.forEach(tx => {
        // Handle both comma and period decimal formats
        const valueStr = (tx.transactionValue || '0').replace(',', '.');
        const value = parseFloat(valueStr) || 0;
        
        if (tx.transactionType === 'credit') {
          totalIncome += value;
        } else {
          totalExpenses += Math.abs(value);
        }
      });
      
      return {
        ...bookObj,
        transactionCount: transactions.length,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
      };
    })
  );
  
  return booksWithStats;
}

/**
 * Get a fiscal book by ID
 * @param {string} id - Fiscal book ID
 * @returns {Promise<Object>} Fiscal book data
 */
export async function getFiscalBookById(id) {
  const book = await fiscalBookRepository.findById(id);
  if (!book) {
    throw new Error('Fiscal book not found');
  }
  return book;
}

/**
 * Update a fiscal book
 * @param {string} id - Fiscal book ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated fiscal book
 */
export async function updateFiscalBook(id, updateData) {
  const updatedBook = await fiscalBookRepository.updateById(id, updateData);
  if (!updatedBook) {
    throw new Error('Fiscal book not found');
  }
  return updatedBook;
}

/**
 * Delete a fiscal book
 * @param {string} id - Fiscal book ID
 * @returns {Promise<Object>} Deleted fiscal book
 */
export async function deleteFiscalBook(id) {
  // First check if the book has transactions
  const transactions = await fiscalBookRepository.findBookTransactions(
    id,
    TransactionModel
  );

  if (transactions.length > 0) {
    throw new Error('Cannot delete fiscal book with associated transactions');
  }

  const deletedBook = await fiscalBookRepository.deleteById(id);
  if (!deletedBook) {
    throw new Error('Fiscal book not found');
  }
  return deletedBook;
}

/**
 * Get fiscal books by type
 * @param {string} bookType - Book type
 * @returns {Promise<Array>} List of fiscal books
 */
export async function getFiscalBooksByType(bookType) {
  return await fiscalBookRepository.findByType(bookType);
}

/**
 * Get fiscal books by period
 * @param {string} bookPeriod - Book period (YYYY-MM or YYYY)
 * @returns {Promise<Array>} List of fiscal books
 */
export async function getFiscalBooksByPeriod(bookPeriod) {
  return await fiscalBookRepository.findByPeriod(bookPeriod);
}

/**
 * Get fiscal books by status
 * @param {string} status - Book status
 * @returns {Promise<Array>} List of fiscal books
 */
export async function getFiscalBooksByStatus(status) {
  return await fiscalBookRepository.findByStatus(status);
}

/**
 * Get fiscal books by company
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} List of fiscal books
 */
export async function getFiscalBooksByCompany(companyId) {
  return await fiscalBookRepository.findByCompany(companyId);
}

/**
 * Close a fiscal book
 * @param {string} id - Fiscal book ID
 * @returns {Promise<Object>} Closed fiscal book
 */
export async function closeFiscalBook(id) {
  // Create before-status-change snapshot if configured
  try {
    await snapshotSchedulerService.createBeforeStatusChangeSnapshot(id, 'Fechado');
  } catch (err) {
    console.warn('Failed to create before-status-change snapshot:', err.message);
    // Don't block the status change
  }

  const closedBook = await fiscalBookRepository.closeBook(id);
  if (!closedBook) {
    throw new Error('Fiscal book not found');
  }
  return closedBook;
}

/**
 * Reopen a fiscal book
 * @param {string} id - Fiscal book ID
 * @returns {Promise<Object>} Reopened fiscal book
 */
export async function reopenFiscalBook(id) {
  // Create before-status-change snapshot if configured
  try {
    await snapshotSchedulerService.createBeforeStatusChangeSnapshot(id, 'Aberto');
  } catch (err) {
    console.warn('Failed to create before-status-change snapshot:', err.message);
    // Don't block the status change
  }

  const reopenedBook = await fiscalBookRepository.reopenBook(id);
  if (!reopenedBook) {
    throw new Error('Fiscal book not found');
  }
  return reopenedBook;
}

/**
 * Get fiscal book statistics
 * @returns {Promise<Object>} Statistics data
 */
export async function getFiscalBookStatistics() {
  return await fiscalBookRepository.getStatistics();
}

/**
 * Get transactions for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @returns {Promise<Array>} List of transactions
 */
export async function getFiscalBookTransactions(fiscalBookId) {
  return await fiscalBookRepository.findBookTransactions(
    fiscalBookId,
    TransactionModel
  );
}

/**
 * Add transaction to a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Updated transaction
 */
export async function addTransactionToFiscalBook(fiscalBookId, transactionId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify book exists
    const book = await fiscalBookRepository.findById(fiscalBookId, session);
    if (!book) {
      throw new Error('Fiscal book not found');
    }

    // Verify transaction exists
    const transaction = await transactionRepository.findById(
      transactionId,
      session
    );
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Validate the relationship
    const validationResult =
      validator.validateTransactionFiscalBookRelationship(book, transaction);
    if (!validationResult.isValid) {
      throw new Error(
        `Invalid transaction-book relationship: ${validationResult.errors.join(
          ', '
        )}`
      );
    }

    // Update the transaction with the fiscal book ID
    transaction.fiscalBookId = fiscalBookId;
    const updatedTransaction = await transactionRepository.updateById(
      transactionId,
      { fiscalBookId },
      session
    );

    await session.commitTransaction();
    return updatedTransaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Remove transaction from fiscal book
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Updated transaction
 */
export async function removeTransactionFromFiscalBook(transactionId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify transaction exists
    const transaction = await transactionRepository.findById(
      transactionId,
      session
    );
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update the transaction to remove fiscal book ID
    const updatedTransaction = await transactionRepository.updateById(
      transactionId,
      { $unset: { fiscalBookId: '' } },
      session
    );

    await session.commitTransaction();
    return updatedTransaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Bulk add transactions to a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Array<string>} transactionIds - Array of transaction IDs
 * @returns {Promise<Object>} Result with count of updated transactions
 */
export async function bulkAddTransactionsToFiscalBook(
  fiscalBookId,
  transactionIds
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify book exists
    const book = await fiscalBookRepository.findById(fiscalBookId, session);
    if (!book) {
      throw new Error('Fiscal book not found');
    }

    // Update all transactions
    const updatePromises = transactionIds.map((id) =>
      transactionRepository.updateById(id, { fiscalBookId }, session)
    );

    const results = await Promise.allSettled(updatePromises);

    // Count successful updates
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value
    ).length;
    const failedCount = results.length - successCount;

    await session.commitTransaction();

    return {
      success: true,
      updatedCount: successCount,
      failedCount,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

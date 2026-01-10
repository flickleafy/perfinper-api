import mongoose from 'mongoose';
import * as transactionRepository from '../../repository/transactionRepository.js';
import * as fiscalBookRepository from '../../repository/fiscalBookRepository.js';

/**
 * Find transactions for a specific period, optionally filtered by company
 * @param {string} period - Period (YYYY-MM or YYYY)
 * @param {string} [companyId] - Optional company ID to filter transactions
 * @returns {Promise<Array>} Filtered transactions
 */
async function findTransactionsForPeriod(period, companyId) {
  let allTransactions;

  console.log('period.length',String(period).length)
  // Check if period is a year or a specific month
  if (String(period).length === 4) {
    // It's a year - get all transactions for the year
    allTransactions = await transactionRepository.findAllInYear(String(period));
  } else {
    // It's a specific period (YYYY-MM)
    allTransactions = await transactionRepository.findAllInPeriod(period);
  }

  // Filter transactions that don't have a fiscal book yet
  // If companyId is provided, also filter by company
  return companyId
    ? allTransactions.filter(
        (t) =>
          t.companyId &&
          t.companyId.toString() === companyId.toString() &&
          !t.fiscalBookId
      )
    : allTransactions.filter((t) => !t.fiscalBookId);
}

/**
 * Migrate transactions to fiscal books based on certain criteria
 * @param {Object} options - Migration options
 * @param {string} [options.companyId] - Optional company ID to filter transactions by
 * @param {string} options.period - Period to filter transactions by (YYYY-MM or YYYY)
 * @param {string} options.bookType - Type of fiscal book to create
 * @param {boolean} options.dryRun - If true, don't commit changes
 * @returns {Promise<Object>} Migration results
 */
export async function migrateTransactionsToFiscalBooks(options = {}) {
  const {
    companyId,
    period = '2023',
    bookType = 'Outros',
    dryRun = false,
  } = options;

  if (!period) {
    throw new Error('Period is required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find transactions that match criteria using repository functions
    const transactions = await findTransactionsForPeriod(period, companyId);

    if (transactions.length === 0) {
      await session.abortTransaction();
      return {
        success: true,
        message: 'No transactions found to migrate',
        count: 0,
      };
    }

    // Create a new fiscal book using the repository
    const bookName = `${bookType} - ${period}`;
    const fiscalBookData = {
      bookName,
      bookType,
      bookPeriod: period,
      status: 'Fechado',
      reference: `Auto-created on ${new Date().toISOString().split('T')[0]}`,
      fiscalData: {
        fiscalYear: parseInt(period.split('-')[0]),
        fiscalPeriod: period.split('-')[1] || 'annual',
      },
    };

    // Add companyId only if it's provided
    if (companyId) {
      fiscalBookData.companyId = companyId;
    }

    let fiscalBook;
    if (!dryRun) {
      fiscalBook = await fiscalBookRepository.insert(fiscalBookData, session);
    } else {
      // For dry run, create an object with _id but don't save it
      fiscalBook = {
        ...fiscalBookData,
        _id: new mongoose.Types.ObjectId(),
        toObject: function () {
          return this;
        },
      };
    }

    // Update all transactions with the fiscal book ID using repository
    if (!dryRun) {
      await transactionRepository.updateFiscalBookForTransactions(
        transactions.map((t) => t._id),
        fiscalBook._id,
        session
      );
    }

    if (!dryRun) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    return {
      success: true,
      message: `${dryRun ? '(Dry run) ' : ''}Successfully migrated ${
        transactions.length
      } transactions to fiscal book "${bookName}"`,
      count: transactions.length,
      fiscalBook: dryRun ? fiscalBook.toObject() : fiscalBook,
    };
  } catch (error) {
    await session.abortTransaction();

    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error,
    };
  } finally {
    session.endSession();
  }
}

/**
 * Group transactions by period and create fiscal books
 * @param {Object} options - Migration options
 * @param {string} [options.companyId] - Optional company ID to filter transactions by
 * @param {string} options.year - Year to filter transactions by (YYYY)
 * @param {string} options.bookType - Type of fiscal book to create
 * @param {boolean} options.dryRun - If true, don't commit changes
 * @returns {Promise<Object>} Migration results
 */
export async function groupTransactionsByPeriod(options = {}) {
  const { companyId, year, bookType = 'Outros', dryRun = false } = options;

  if (!year) {
    throw new Error('Year is required');
  }

  try {
    // Get all periods for the year using repository
    const periods = await transactionRepository.findPeriods();
    const yearPeriods = periods.filter((period) =>
      period.startsWith(`${year}-`)
    );

    const results = [];

    // Migrate each period
    for (const period of yearPeriods) {
      const result = await migrateTransactionsToFiscalBooks({
        companyId,
        period,
        bookType,
        dryRun,
      });

      results.push({
        period,
        ...result,
      });
    }

    return {
      success: true,
      message: `Processed ${yearPeriods.length} periods`,
      results,
    };
  } catch (error) {
    return {
      success: false,
      message: `Operation failed: ${error.message}`,
      error,
    };
  }
}

export default {
  migrateTransactionsToFiscalBooks,
  groupTransactionsByPeriod,
};

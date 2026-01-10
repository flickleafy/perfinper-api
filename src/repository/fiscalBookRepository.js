import FiscalBookModel from '../models/FiscalBookModel.js';
import { startSession } from 'mongoose';

/**
 * Find all fiscal books with optional filtering
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - Query options (limit, skip, sort)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of fiscal book documents
 */
export async function findAll(filter = {}, options = {}, session = null) {
  try {
    const query = FiscalBookModel.find(filter);

    if (session) {
      query.session(session);
    }

    if (options.limit) query.limit(options.limit);
    if (options.skip) query.skip(options.skip);
    if (options.sort) query.sort(options.sort);

    return await query.exec();
  } catch (error) {
    console.error('Error in findAll:', error.message);
    throw new Error('Failed to retrieve all fiscal books.');
  }
}

/**
 * Find fiscal book by ID
 * @param {string} id - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Fiscal book document or null
 */
export async function findById(id, session = null) {
  try {
    let fiscalBook;
    if (session) {
      fiscalBook = await FiscalBookModel.findById(id).session(session);
    } else {
      fiscalBook = await FiscalBookModel.findById(id);
    }
    if (!fiscalBook) {
      return null;
    }
    return fiscalBook;
  } catch (error) {
    console.error('Error in findById:', error.message);
    throw new Error('An error occurred while finding the fiscal book by ID.');
  }
}

/**
 * Find fiscal books by type
 * @param {string} bookType - Book type to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of fiscal book documents
 */
export async function findByType(bookType, session = null) {
  try {
    const query = FiscalBookModel.find({ bookType });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in findByType:', error.message);
    throw new Error('An error occurred while finding fiscal books by type.');
  }
}

/**
 * Find fiscal books by period
 * @param {string} bookPeriod - Period to search for (YYYY-MM or YYYY)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of fiscal book documents
 */
export async function findByPeriod(bookPeriod, session = null) {
  try {
    const query = FiscalBookModel.find({ bookPeriod });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in findByPeriod:', error.message);
    throw new Error('An error occurred while finding fiscal books by period.');
  }
}

/**
 * Find fiscal books by status
 * @param {string} status - Status to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of fiscal book documents
 */
export async function findByStatus(status, session = null) {
  try {
    const query = FiscalBookModel.find({ status });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in findByStatus:', error.message);
    throw new Error('An error occurred while finding fiscal books by status.');
  }
}

/**
 * Find fiscal books by company
 * @param {string} companyId - Company ID to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of fiscal book documents
 */
export async function findByCompany(companyId, session = null) {
  try {
    const query = FiscalBookModel.find({ companyId });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in findByCompany:', error.message);
    throw new Error('An error occurred while finding fiscal books by company.');
  }
}

/**
 * Insert a new fiscal book
 * @param {Object} fiscalBookData - Fiscal book data to insert
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Created fiscal book document
 */
export async function insert(fiscalBookData, session = null) {
  try {
    const fiscalBook = new FiscalBookModel(fiscalBookData);

    if (session) {
      return await fiscalBook.save({ session });
    }

    return await fiscalBook.save();
  } catch (error) {
    console.error('Error in insert:', error.message);
    throw new Error('An error occurred while inserting the fiscal book.');
  }
}

/**
 * Update fiscal book by ID
 * @param {string} id - Fiscal book ID
 * @param {Object} updateData - Data to update
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated fiscal book document or null
 */
export async function updateById(id, updateData, session = null) {
  try {
    const options = { new: true }; // Return updated document
    if (session) {
      options.session = session;
    }

    const updatedFiscalBook = await FiscalBookModel.findByIdAndUpdate(
      id,
      updateData,
      options
    );

    return updatedFiscalBook || null;
  } catch (error) {
    console.error('Error in updateById:', error.message);
    throw new Error('An error occurred while updating the fiscal book.');
  }
}

/**
 * Delete fiscal book by ID
 * @param {string} id - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Deleted fiscal book document or null
 */
export async function deleteById(id, session = null) {
  try {
    const options = {};
    if (session) {
      options.session = session;
    }

    const deletedFiscalBook = await FiscalBookModel.findByIdAndDelete(
      id,
      options
    );

    return deletedFiscalBook || null;
  } catch (error) {
    console.error('Error in deleteById:', error.message);
    throw new Error('An error occurred while deleting the fiscal book.');
  }
}

/**
 * Close a fiscal book (update status to 'Fechado')
 * @param {string} id - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated fiscal book document or null
 */
export async function closeBook(id, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const closedBook = await FiscalBookModel.findByIdAndUpdate(
      id,
      {
        status: 'Fechado',
        closedAt: new Date(),
        updatedAt: new Date(),
      },
      options
    );

    return closedBook || null;
  } catch (error) {
    console.error('Error in closeBook:', error.message);
    throw new Error('An error occurred while closing the fiscal book.');
  }
}

/**
 * Reopen a fiscal book (update status back to 'Em Revisão')
 * @param {string} id - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated fiscal book document or null
 */
export async function reopenBook(id, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const reopenedBook = await FiscalBookModel.findByIdAndUpdate(
      id,
      {
        status: 'Em Revisão',
        updatedAt: new Date(),
      },
      options
    );

    return reopenedBook || null;
  } catch (error) {
    console.error('Error in reopenBook:', error.message);
    throw new Error('An error occurred while reopening the fiscal book.');
  }
}

/**
 * Get statistics about fiscal books
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Statistics object
 */
export async function getStatistics(session = null) {
  try {
    const pipeline = [
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          openBooks: {
            $sum: { $cond: [{ $eq: ['$status', 'Aberto'] }, 1, 0] },
          },
          closedBooks: {
            $sum: { $cond: [{ $eq: ['$status', 'Fechado'] }, 1, 0] },
          },
          inReviewBooks: {
            $sum: { $cond: [{ $eq: ['$status', 'Em Revisão'] }, 1, 0] },
          },
          archivedBooks: {
            $sum: { $cond: [{ $eq: ['$status', 'Arquivado'] }, 1, 0] },
          },
          byType: {
            $push: {
              k: '$bookType',
              v: 1,
            },
          },
          byPeriod: {
            $push: {
              k: '$bookPeriod',
              v: 1,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          openBooks: 1,
          closedBooks: 1,
          inReviewBooks: 1,
          archivedBooks: 1,
          byType: { $arrayToObject: '$byType' },
          byPeriod: { $arrayToObject: '$byPeriod' },
        },
      },
    ];

    const aggregation = FiscalBookModel.aggregate(pipeline);

    if (session) {
      aggregation.session(session);
    }

    const results = await aggregation.exec();

    return (
      results[0] || {
        total: 0,
        openBooks: 0,
        closedBooks: 0,
        inReviewBooks: 0,
        archivedBooks: 0,
        byType: {},
        byPeriod: {},
      }
    );
  } catch (error) {
    console.error('Error in getStatistics:', error.message);
    throw new Error('An error occurred while getting fiscal book statistics.');
  }
}

/**
 * Find transactions associated with a fiscal book (through TransactionModel)
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} TransactionModel - Mongoose model for transactions
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of transaction documents
 */
export async function findBookTransactions(
  fiscalBookId,
  TransactionModel,
  session = null
) {
  try {
    const query = TransactionModel.find({ fiscalBookId });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in findBookTransactions:', error.message);
    throw new Error(
      'An error occurred while finding transactions for the fiscal book.'
    );
  }
}

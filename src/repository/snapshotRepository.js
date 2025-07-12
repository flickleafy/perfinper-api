import FiscalBookSnapshotModel from '../models/FiscalBookSnapshotModel.js';
import SnapshotTransactionModel from '../models/SnapshotTransactionModel.js';
import SnapshotScheduleModel from '../models/SnapshotScheduleModel.js';
import TransactionModel from '../models/TransactionModel.js';
import FiscalBookModel from '../models/FiscalBookModel.js';

/**
 * Create a new snapshot for a fiscal book
 * @param {Object} snapshotData - Snapshot data including fiscalBookData and metadata
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Created snapshot document
 */
export async function createSnapshot(snapshotData, session = null) {
  try {
    const snapshot = new FiscalBookSnapshotModel(snapshotData);

    if (session) {
      return await snapshot.save({ session });
    }

    return await snapshot.save();
  } catch (error) {
    console.error('Error in createSnapshot:', error.message);
    throw new Error('Failed to create snapshot.');
  }
}

/**
 * Create snapshot transactions in bulk
 * @param {Array} transactionsData - Array of snapshot transaction data
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Created snapshot transaction documents
 */
export async function createSnapshotTransactions(transactionsData, session = null) {
  try {
    if (session) {
      return await SnapshotTransactionModel.insertMany(transactionsData, { session });
    }

    return await SnapshotTransactionModel.insertMany(transactionsData);
  } catch (error) {
    console.error('Error in createSnapshotTransactions:', error.message);
    throw new Error('Failed to create snapshot transactions.');
  }
}

/**
 * Find snapshots by fiscal book ID with optional filtering
 * @param {string} fiscalBookId - Original fiscal book ID
 * @param {Object} options - Query options (limit, skip, sort, tags)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of snapshot documents
 */
export async function findSnapshotsByFiscalBook(fiscalBookId, options = {}, session = null) {
  try {
    const filter = { originalFiscalBookId: fiscalBookId };

    // Add tag filtering if specified
    if (options.tags && options.tags.length > 0) {
      filter.tags = { $all: options.tags };
    }

    const query = FiscalBookSnapshotModel.find(filter);

    if (session) {
      query.session(session);
    }

    if (options.limit) query.limit(options.limit);
    if (options.skip) query.skip(options.skip);

    // Default sort by creation date descending
    const sortOrder = options.sort || { createdAt: -1 };
    query.sort(sortOrder);

    return await query.exec();
  } catch (error) {
    console.error('Error in findSnapshotsByFiscalBook:', error.message);
    throw new Error('Failed to retrieve snapshots for fiscal book.');
  }
}

/**
 * Count snapshots for a fiscal book
 * @param {string} fiscalBookId - Original fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<number>} Snapshot count
 */
export async function countSnapshotsByFiscalBook(fiscalBookId, session = null) {
  try {
    const query = FiscalBookSnapshotModel.countDocuments({ originalFiscalBookId: fiscalBookId });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in countSnapshotsByFiscalBook:', error.message);
    throw new Error('Failed to count snapshots for fiscal book.');
  }
}

/**
 * Find snapshot by ID
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Snapshot document or null
 */
export async function findSnapshotById(snapshotId, session = null) {
  try {
    let snapshot;
    if (session) {
      snapshot = await FiscalBookSnapshotModel.findById(snapshotId).session(session);
    } else {
      snapshot = await FiscalBookSnapshotModel.findById(snapshotId);
    }
    return snapshot || null;
  } catch (error) {
    console.error('Error in findSnapshotById:', error.message);
    throw new Error('An error occurred while finding the snapshot by ID.');
  }
}

/**
 * Get transactions for a snapshot with pagination
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Object with transactions array and total count
 */
export async function getSnapshotTransactions(snapshotId, options = {}, session = null) {
  try {
    const filter = { snapshotId };
    const query = SnapshotTransactionModel.find(filter);

    if (session) {
      query.session(session);
    }

    const limit = options.limit || 50;
    const skip = options.skip || 0;
    const sort = options.sort || { 'transactionData.transactionDate': -1 };

    query.limit(limit).skip(skip).sort(sort);

    const [transactions, total] = await Promise.all([
      query.exec(),
      SnapshotTransactionModel.countDocuments(filter).session(session || undefined),
    ]);

    return {
      transactions,
      total,
      limit,
      skip,
    };
  } catch (error) {
    console.error('Error in getSnapshotTransactions:', error.message);
    throw new Error('Failed to retrieve snapshot transactions.');
  }
}

/**
 * Delete a snapshot and its associated transactions
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Deleted snapshot document or null
 */
export async function deleteSnapshot(snapshotId, session = null) {
  try {
    // First check if snapshot is protected
    const snapshot = await findSnapshotById(snapshotId, session);
    if (!snapshot) {
      return null;
    }

    if (snapshot.isProtected) {
      throw new Error('Cannot delete a protected snapshot. Remove protection first.');
    }

    // Delete all associated transactions
    const deleteTransactionsOptions = {};
    if (session) {
      deleteTransactionsOptions.session = session;
    }
    await SnapshotTransactionModel.deleteMany({ snapshotId }, deleteTransactionsOptions);

    // Delete the snapshot
    const deleteOptions = {};
    if (session) {
      deleteOptions.session = session;
    }
    const deletedSnapshot = await FiscalBookSnapshotModel.findByIdAndDelete(
      snapshotId,
      deleteOptions
    );

    return deletedSnapshot || null;
  } catch (error) {
    console.error('Error in deleteSnapshot:', error.message);
    throw error;
  }
}

/**
 * Delete all snapshots for a fiscal book
 * @param {string} fiscalBookId - Original fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Delete result with count
 */
export async function deleteSnapshotsByFiscalBook(fiscalBookId, session = null) {
  try {
    // Find all snapshots for the fiscal book
    const snapshots = await findSnapshotsByFiscalBook(fiscalBookId, {}, session);
    const snapshotIds = snapshots.map(s => s._id);

    // Delete all associated transactions
    const deleteTransactionsOptions = {};
    if (session) {
      deleteTransactionsOptions.session = session;
    }
    await SnapshotTransactionModel.deleteMany(
      { snapshotId: { $in: snapshotIds } },
      deleteTransactionsOptions
    );

    // Delete all snapshots
    const deleteOptions = {};
    if (session) {
      deleteOptions.session = session;
    }
    const result = await FiscalBookSnapshotModel.deleteMany(
      { originalFiscalBookId: fiscalBookId },
      deleteOptions
    );

    return { deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error in deleteSnapshotsByFiscalBook:', error.message);
    throw new Error('Failed to delete snapshots for fiscal book.');
  }
}

/**
 * Update snapshot tags
 * @param {string} snapshotId - Snapshot ID
 * @param {Array<string>} tags - New tags array
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated snapshot document or null
 */
export async function updateSnapshotTags(snapshotId, tags, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const updatedSnapshot = await FiscalBookSnapshotModel.findByIdAndUpdate(
      snapshotId,
      { tags },
      options
    );

    return updatedSnapshot || null;
  } catch (error) {
    console.error('Error in updateSnapshotTags:', error.message);
    throw new Error('Failed to update snapshot tags.');
  }
}

/**
 * Toggle snapshot protection status
 * @param {string} snapshotId - Snapshot ID
 * @param {boolean} isProtected - New protection status
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated snapshot document or null
 */
export async function setSnapshotProtection(snapshotId, isProtected, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const updatedSnapshot = await FiscalBookSnapshotModel.findByIdAndUpdate(
      snapshotId,
      { isProtected },
      options
    );

    return updatedSnapshot || null;
  } catch (error) {
    console.error('Error in setSnapshotProtection:', error.message);
    throw new Error('Failed to update snapshot protection status.');
  }
}

/**
 * Add annotation to a snapshot
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} annotation - Annotation data {content, createdBy}
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated snapshot document or null
 */
export async function addSnapshotAnnotation(snapshotId, annotation, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const updatedSnapshot = await FiscalBookSnapshotModel.findByIdAndUpdate(
      snapshotId,
      {
        $push: {
          annotations: {
            content: annotation.content,
            createdBy: annotation.createdBy,
            createdAt: new Date(),
          },
        },
      },
      options
    );

    return updatedSnapshot || null;
  } catch (error) {
    console.error('Error in addSnapshotAnnotation:', error.message);
    throw new Error('Failed to add annotation to snapshot.');
  }
}

/**
 * Add annotation to a snapshot transaction
 * @param {string} snapshotTransactionId - Snapshot transaction ID
 * @param {Object} annotation - Annotation data {content, createdBy}
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated snapshot transaction document or null
 */
export async function addTransactionAnnotation(snapshotTransactionId, annotation, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const updatedTransaction = await SnapshotTransactionModel.findByIdAndUpdate(
      snapshotTransactionId,
      {
        $push: {
          annotations: {
            content: annotation.content,
            createdBy: annotation.createdBy,
            createdAt: new Date(),
          },
        },
      },
      options
    );

    return updatedTransaction || null;
  } catch (error) {
    console.error('Error in addTransactionAnnotation:', error.message);
    throw new Error('Failed to add annotation to snapshot transaction.');
  }
}

/**
 * Get current transactions for a fiscal book (for comparison)
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of current transactions
 */
export async function getCurrentTransactions(fiscalBookId, session = null) {
  try {
    const query = TransactionModel.find({ fiscalBookId });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in getCurrentTransactions:', error.message);
    throw new Error('Failed to retrieve current transactions.');
  }
}

/**
 * Get fiscal book by ID
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Fiscal book document or null
 */
export async function getFiscalBook(fiscalBookId, session = null) {
  try {
    let fiscalBook;
    if (session) {
      fiscalBook = await FiscalBookModel.findById(fiscalBookId).session(session);
    } else {
      fiscalBook = await FiscalBookModel.findById(fiscalBookId);
    }
    return fiscalBook || null;
  } catch (error) {
    console.error('Error in getFiscalBook:', error.message);
    throw new Error('An error occurred while finding the fiscal book.');
  }
}

// ===== Schedule Repository Functions =====

/**
 * Get schedule for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Schedule document or null
 */
export async function getSchedule(fiscalBookId, session = null) {
  try {
    const query = SnapshotScheduleModel.findOne({ fiscalBookId });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in getSchedule:', error.message);
    throw new Error('Failed to retrieve snapshot schedule.');
  }
}

/**
 * Create or update schedule for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} scheduleData - Schedule configuration
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Schedule document
 */
export async function upsertSchedule(fiscalBookId, scheduleData, session = null) {
  try {
    const options = { new: true, upsert: true };
    if (session) {
      options.session = session;
    }

    const schedule = await SnapshotScheduleModel.findOneAndUpdate(
      { fiscalBookId },
      { ...scheduleData, fiscalBookId },
      options
    );

    return schedule;
  } catch (error) {
    console.error('Error in upsertSchedule:', error.message);
    throw new Error('Failed to update snapshot schedule.');
  }
}

/**
 * Delete schedule for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Deleted schedule document or null
 */
export async function deleteSchedule(fiscalBookId, session = null) {
  try {
    const options = {};
    if (session) {
      options.session = session;
    }

    const deletedSchedule = await SnapshotScheduleModel.findOneAndDelete(
      { fiscalBookId },
      options
    );

    return deletedSchedule || null;
  } catch (error) {
    console.error('Error in deleteSchedule:', error.message);
    throw new Error('Failed to delete snapshot schedule.');
  }
}

/**
 * Find schedules that are due for execution
 * @param {Date} beforeDate - Find schedules with nextExecutionAt before this date
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of schedule documents
 */
export async function findDueSchedules(beforeDate, session = null) {
  try {
    const query = SnapshotScheduleModel.find({
      enabled: true,
      nextExecutionAt: { $lte: beforeDate },
    });

    if (session) {
      query.session(session);
    }

    return await query.exec();
  } catch (error) {
    console.error('Error in findDueSchedules:', error.message);
    throw new Error('Failed to find due schedules.');
  }
}

/**
 * Update schedule after execution
 * @param {string} scheduleId - Schedule ID
 * @param {Date} lastExecutedAt - Last execution timestamp
 * @param {Date} nextExecutionAt - Next execution timestamp
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated schedule document or null
 */
export async function updateScheduleExecution(scheduleId, lastExecutedAt, nextExecutionAt, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    const updatedSchedule = await SnapshotScheduleModel.findByIdAndUpdate(
      scheduleId,
      { lastExecutedAt, nextExecutionAt },
      options
    );

    return updatedSchedule || null;
  } catch (error) {
    console.error('Error in updateScheduleExecution:', error.message);
    throw new Error('Failed to update schedule execution.');
  }
}

/**
 * Find oldest scheduled snapshots beyond retention limit
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {number} retentionCount - Number of snapshots to keep
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of snapshot IDs to delete
 */
export async function findSnapshotsToCleanup(fiscalBookId, retentionCount, session = null) {
  try {
    // Find all scheduled snapshots for this fiscal book
    const query = FiscalBookSnapshotModel.find({
      originalFiscalBookId: fiscalBookId,
      creationSource: 'scheduled',
      isProtected: false, // Don't delete protected snapshots
    })
      .sort({ createdAt: -1 })
      .skip(retentionCount)
      .select('_id');

    if (session) {
      query.session(session);
    }

    const snapshots = await query.exec();
    return snapshots.map(s => s._id);
  } catch (error) {
    console.error('Error in findSnapshotsToCleanup:', error.message);
    throw new Error('Failed to find snapshots for cleanup.');
  }
}

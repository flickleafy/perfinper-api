import mongoose from 'mongoose';
import * as snapshotRepository from '../repository/snapshotRepository.js';

/**
 * Create a fiscal book snapshot with all its transactions
 * @param {string} fiscalBookId - Fiscal book ID to snapshot
 * @param {Object} options - Snapshot options
 * @param {string} options.name - Optional snapshot name
 * @param {string} options.description - Optional description
 * @param {Array<string>} options.tags - Optional initial tags
 * @param {string} options.creationSource - Creation source (default: 'manual')
 * @returns {Promise<Object>} Created snapshot with statistics
 */
export async function createFiscalBookSnapshot(fiscalBookId, options = {}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch the fiscal book
    const fiscalBook = await snapshotRepository.getFiscalBook(fiscalBookId, session);
    if (!fiscalBook) {
      throw new Error('Fiscal book not found.');
    }

    // 2. Fetch all transactions for this fiscal book
    const transactions = await snapshotRepository.getCurrentTransactions(fiscalBookId, session);

    // 3. Compute statistics
    const statistics = computeStatistics(transactions);

    // 4. Build snapshot data
    const snapshotData = {
      originalFiscalBookId: fiscalBookId,
      snapshotName: options.name || `Snapshot ${new Date().toISOString().split('T')[0]}`,
      snapshotDescription: options.description,
      creationSource: options.creationSource || 'manual',
      tags: options.tags || [],
      fiscalBookData: {
        bookName: fiscalBook.bookName,
        bookType: fiscalBook.bookType,
        bookPeriod: fiscalBook.bookPeriod,
        reference: fiscalBook.reference,
        status: fiscalBook.status,
        fiscalData: fiscalBook.fiscalData,
        companyId: fiscalBook.companyId,
        notes: fiscalBook.notes,
        createdAt: fiscalBook.createdAt,
        updatedAt: fiscalBook.updatedAt,
        closedAt: fiscalBook.closedAt,
      },
      statistics,
    };

    // 5. Create the snapshot
    const snapshot = await snapshotRepository.createSnapshot(snapshotData, session);

    // 6. Copy all transactions to snapshot
    if (transactions.length > 0) {
      const snapshotTransactions = transactions.map(transaction => ({
        snapshotId: snapshot._id,
        originalTransactionId: transaction._id,
        transactionData: {
          transactionDate: transaction.transactionDate,
          transactionPeriod: transaction.transactionPeriod,
          transactionSource: transaction.transactionSource,
          transactionValue: transaction.transactionValue,
          transactionName: transaction.transactionName,
          transactionDescription: transaction.transactionDescription,
          transactionFiscalNote: transaction.transactionFiscalNote,
          transactionId: transaction.transactionId,
          transactionStatus: transaction.transactionStatus,
          transactionLocation: transaction.transactionLocation,
          transactionType: transaction.transactionType,
          transactionInstallments: transaction.transactionInstallments,
          installments: transaction.installments,
          transactionCategory: transaction.transactionCategory,
          freightValue: transaction.freightValue,
          paymentMethod: transaction.paymentMethod,
          items: transaction.items,
          companyName: transaction.companyName,
          companySellerName: transaction.companySellerName,
          companyCnpj: transaction.companyCnpj,
          companyId: transaction.companyId,
        },
      }));

      await snapshotRepository.createSnapshotTransactions(snapshotTransactions, session);
    }

    await session.commitTransaction();

    return snapshot;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating snapshot:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Compute statistics from transactions
 * @private
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Statistics object
 */
function computeStatistics(transactions) {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(transaction => {
    const value = parseFloat(transaction.transactionValue) || 0;
    if (transaction.transactionType === 'credit') {
      totalIncome += value;
    } else {
      totalExpenses += Math.abs(value);
    }
  });

  return {
    transactionCount: transactions.length,
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
  };
}

/**
 * Get snapshots for a fiscal book with optional filtering
 * @param {string} fiscalBookId - Fiscal book ID
 * @param {Object} filters - Filter options
 * @param {Array<string>} filters.tags - Filter by tags (AND logic)
 * @param {number} filters.limit - Pagination limit
 * @param {number} filters.skip - Pagination skip
 * @returns {Promise<Object>} Object with snapshots array and total count
 */
export async function getSnapshotsForFiscalBook(fiscalBookId, filters = {}) {
  try {
    const options = {
      limit: filters.limit || 50,
      skip: filters.skip || 0,
      tags: filters.tags,
    };

    const [snapshots, total] = await Promise.all([
      snapshotRepository.findSnapshotsByFiscalBook(fiscalBookId, options),
      snapshotRepository.countSnapshotsByFiscalBook(fiscalBookId),
    ]);

    return {
      snapshots,
      total,
      limit: options.limit,
      skip: options.skip,
    };
  } catch (error) {
    console.error('Error getting snapshots for fiscal book:', error.message);
    throw error;
  }
}

/**
 * Get snapshot details by ID
 * @param {string} snapshotId - Snapshot ID
 * @returns {Promise<Object|null>} Snapshot document or null
 */
export async function getSnapshotDetails(snapshotId) {
  try {
    return await snapshotRepository.findSnapshotById(snapshotId);
  } catch (error) {
    console.error('Error getting snapshot details:', error.message);
    throw error;
  }
}

/**
 * Get transactions for a snapshot with pagination
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} pagination - Pagination options
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.skip - Items to skip
 * @returns {Promise<Object>} Paginated transactions result
 */
export async function getSnapshotTransactions(snapshotId, pagination = {}) {
  try {
    return await snapshotRepository.getSnapshotTransactions(snapshotId, {
      limit: pagination.limit || 50,
      skip: pagination.skip || 0,
    });
  } catch (error) {
    console.error('Error getting snapshot transactions:', error.message);
    throw error;
  }
}

/**
 * Compare a snapshot with the current fiscal book state
 * @param {string} snapshotId - Snapshot ID
 * @returns {Promise<Object>} Comparison result
 */
export async function compareSnapshotWithCurrent(snapshotId) {
  try {
    // 1. Get the snapshot
    const snapshot = await snapshotRepository.findSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found.');
    }

    // 2. Get snapshot transactions
    const snapshotTransactionsResult = await snapshotRepository.getSnapshotTransactions(
      snapshotId,
      { limit: 10000 } // Get all for comparison
    );
    const snapshotTransactions = snapshotTransactionsResult.transactions;

    // 3. Get current transactions
    const currentTransactions = await snapshotRepository.getCurrentTransactions(
      snapshot.originalFiscalBookId
    );

    // 4. Build lookup maps
    const snapshotMap = new Map();
    snapshotTransactions.forEach(st => {
      if (st.originalTransactionId) {
        snapshotMap.set(st.originalTransactionId.toString(), st);
      }
    });

    const currentMap = new Map();
    currentTransactions.forEach(ct => {
      currentMap.set(ct._id.toString(), ct);
    });

    // 5. Categorize transactions
    const added = [];      // In current but not in snapshot
    const removed = [];    // In snapshot but not in current
    const modified = [];   // In both but with different values
    const unchanged = [];  // Identical in both

    // Check current transactions against snapshot
    currentTransactions.forEach(currentTx => {
      const id = currentTx._id.toString();
      const snapshotTx = snapshotMap.get(id);

      if (!snapshotTx) {
        added.push({
          id,
          transaction: currentTx,
        });
      } else {
        // Check if modified
        const changes = detectChanges(snapshotTx.transactionData, currentTx);
        if (changes.length > 0) {
          modified.push({
            id,
            original: snapshotTx.transactionData,
            current: currentTx,
            changes,
          });
        } else {
          unchanged.push({
            id,
            transaction: currentTx,
          });
        }
      }
    });

    // Check snapshot transactions not in current
    snapshotTransactions.forEach(snapshotTx => {
      if (snapshotTx.originalTransactionId) {
        const id = snapshotTx.originalTransactionId.toString();
        if (!currentMap.has(id)) {
          removed.push({
            id,
            transaction: snapshotTx.transactionData,
          });
        }
      }
    });

    // 6. Compute summary statistics
    const currentStats = computeStatistics(currentTransactions);
    const snapshotStats = snapshot.statistics;

    const summary = {
      snapshotStats,
      currentStats,
      differences: {
        transactionCountDiff: currentStats.transactionCount - snapshotStats.transactionCount,
        totalIncomeDiff: currentStats.totalIncome - snapshotStats.totalIncome,
        totalExpensesDiff: currentStats.totalExpenses - snapshotStats.totalExpenses,
        netAmountDiff: currentStats.netAmount - snapshotStats.netAmount,
      },
    };

    return {
      snapshotId,
      snapshotName: snapshot.snapshotName,
      snapshotDate: snapshot.createdAt,
      fiscalBookId: snapshot.originalFiscalBookId,
      added,
      removed,
      modified,
      unchanged,
      summary,
      counts: {
        added: added.length,
        removed: removed.length,
        modified: modified.length,
        unchanged: unchanged.length,
      },
    };
  } catch (error) {
    console.error('Error comparing snapshot with current:', error.message);
    throw error;
  }
}

/**
 * Detect changes between snapshot transaction data and current transaction
 * @private
 * @param {Object} snapshotData - Snapshot transaction data
 * @param {Object} currentTx - Current transaction
 * @returns {Array} Array of changes
 */
function detectChanges(snapshotData, currentTx) {
  const changes = [];
  const fieldsToCompare = [
    'transactionValue',
    'transactionName',
    'transactionDescription',
    'transactionStatus',
    'transactionType',
    'transactionCategory',
    'paymentMethod',
  ];

  fieldsToCompare.forEach(field => {
    const snapshotValue = snapshotData[field]?.toString() || '';
    const currentValue = currentTx[field]?.toString() || '';

    if (snapshotValue !== currentValue) {
      changes.push({
        field,
        oldValue: snapshotValue,
        newValue: currentValue,
      });
    }
  });

  return changes;
}

/**
 * Delete a snapshot
 * @param {string} snapshotId - Snapshot ID
 * @returns {Promise<Object|null>} Deleted snapshot or null
 */
export async function deleteSnapshot(snapshotId) {
  try {
    return await snapshotRepository.deleteSnapshot(snapshotId);
  } catch (error) {
    console.error('Error deleting snapshot:', error.message);
    throw error;
  }
}

/**
 * Delete all snapshots for a fiscal book
 * @param {string} fiscalBookId - Fiscal book ID
 * @returns {Promise<Object>} Delete result
 */
export async function deleteSnapshotsByFiscalBook(fiscalBookId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await snapshotRepository.deleteSnapshotsByFiscalBook(fiscalBookId, session);
    
    // Also delete the schedule
    await snapshotRepository.deleteSchedule(fiscalBookId, session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting snapshots for fiscal book:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Update snapshot tags
 * @param {string} snapshotId - Snapshot ID
 * @param {Array<string>} tags - New tags array
 * @returns {Promise<Object|null>} Updated snapshot or null
 */
export async function updateTags(snapshotId, tags) {
  try {
    // Normalize tags
    const normalizedTags = tags.map(tag => tag.trim().toLowerCase());
    return await snapshotRepository.updateSnapshotTags(snapshotId, normalizedTags);
  } catch (error) {
    console.error('Error updating snapshot tags:', error.message);
    throw error;
  }
}

/**
 * Toggle snapshot protection status
 * @param {string} snapshotId - Snapshot ID
 * @param {boolean} isProtected - New protection status
 * @returns {Promise<Object|null>} Updated snapshot or null
 */
export async function toggleProtection(snapshotId, isProtected) {
  try {
    return await snapshotRepository.setSnapshotProtection(snapshotId, isProtected);
  } catch (error) {
    console.error('Error toggling snapshot protection:', error.message);
    throw error;
  }
}

/**
 * Add annotation to a snapshot
 * @param {string} snapshotId - Snapshot ID
 * @param {string} content - Annotation content
 * @param {string} createdBy - User identifier
 * @returns {Promise<Object|null>} Updated snapshot or null
 */
export async function addAnnotation(snapshotId, content, createdBy = 'system') {
  try {
    return await snapshotRepository.addSnapshotAnnotation(snapshotId, {
      content,
      createdBy,
    });
  } catch (error) {
    console.error('Error adding snapshot annotation:', error.message);
    throw error;
  }
}

/**
 * Add annotation to a snapshot transaction
 * @param {string} snapshotTransactionId - Snapshot transaction ID
 * @param {string} content - Annotation content
 * @param {string} createdBy - User identifier
 * @returns {Promise<Object|null>} Updated snapshot transaction or null
 */
export async function addTransactionAnnotation(snapshotTransactionId, content, createdBy = 'system') {
  try {
    return await snapshotRepository.addTransactionAnnotation(snapshotTransactionId, {
      content,
      createdBy,
    });
  } catch (error) {
    console.error('Error adding transaction annotation:', error.message);
    throw error;
  }
}

/**
 * Export snapshot data
 * @param {string} snapshotId - Snapshot ID
 * @param {string} format - Export format ('csv', 'json', 'pdf')
 * @returns {Promise<Object>} Export result with data and metadata
 */
export async function exportSnapshot(snapshotId, format = 'json') {
  try {
    const snapshot = await snapshotRepository.findSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found.');
    }

    const transactionsResult = await snapshotRepository.getSnapshotTransactions(
      snapshotId,
      { limit: 10000 }
    );

    const exportData = {
      snapshot: {
        id: snapshot._id,
        name: snapshot.snapshotName,
        description: snapshot.snapshotDescription,
        createdAt: snapshot.createdAt,
        creationSource: snapshot.creationSource,
        tags: snapshot.tags,
        fiscalBookData: snapshot.fiscalBookData,
        statistics: snapshot.statistics,
        annotations: snapshot.annotations,
      },
      transactions: transactionsResult.transactions.map(t => ({
        ...t.transactionData,
        annotations: t.annotations,
      })),
    };

    if (format === 'json') {
      return {
        format: 'json',
        contentType: 'application/json',
        data: JSON.stringify(exportData, null, 2),
        fileName: `snapshot-${snapshot.snapshotName}-${snapshot.createdAt.toISOString().split('T')[0]}.json`,
      };
    }

    if (format === 'csv') {
      const csvData = generateCSV(exportData);
      return {
        format: 'csv',
        contentType: 'text/csv',
        data: csvData,
        fileName: `snapshot-${snapshot.snapshotName}-${snapshot.createdAt.toISOString().split('T')[0]}.csv`,
      };
    }

    // PDF format would require additional library integration
    throw new Error('PDF export not yet implemented.');
  } catch (error) {
    console.error('Error exporting snapshot:', error.message);
    throw error;
  }
}

/**
 * Generate CSV from export data
 * @private
 * @param {Object} exportData - Export data object
 * @returns {string} CSV string
 */
function generateCSV(exportData) {
  const headers = [
    'Date',
    'Name',
    'Description',
    'Value',
    'Type',
    'Status',
    'Category',
    'Payment Method',
    'Company',
  ];

  const rows = exportData.transactions.map(t => [
    t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
    t.transactionName || '',
    t.transactionDescription || '',
    t.transactionValue || '',
    t.transactionType || '',
    t.transactionStatus || '',
    t.transactionCategory || '',
    t.paymentMethod || '',
    t.companyName || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Clone a snapshot to create a new fiscal book
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} newBookData - Optional overrides for new fiscal book
 * @returns {Promise<Object>} Created fiscal book
 */
export async function cloneToNewFiscalBook(snapshotId, newBookData = {}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get the snapshot
    const snapshot = await snapshotRepository.findSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found.');
    }

    // 2. Get snapshot transactions
    const transactionsResult = await snapshotRepository.getSnapshotTransactions(
      snapshotId,
      { limit: 10000 }
    );

    // 3. Create new fiscal book from snapshot data
    const FiscalBookModel = (await import('../models/FiscalBookModel.js')).default;
    const TransactionModel = (await import('../models/TransactionModel.js')).default;

    const fiscalBookData = {
      bookName: newBookData.bookName || `${snapshot.fiscalBookData.bookName} (Cópia)`,
      bookType: newBookData.bookType || snapshot.fiscalBookData.bookType,
      bookPeriod: newBookData.bookPeriod || snapshot.fiscalBookData.bookPeriod,
      reference: newBookData.reference || snapshot.fiscalBookData.reference,
      status: 'Aberto', // New books start as open
      fiscalData: newBookData.fiscalData || snapshot.fiscalBookData.fiscalData,
      companyId: newBookData.companyId || snapshot.fiscalBookData.companyId,
      notes: newBookData.notes || snapshot.fiscalBookData.notes,
    };

    const newFiscalBook = new FiscalBookModel(fiscalBookData);
    await newFiscalBook.save({ session });

    // 4. Create new transactions
    if (transactionsResult.transactions.length > 0) {
      const newTransactions = transactionsResult.transactions.map(st => ({
        ...st.transactionData,
        fiscalBookId: newFiscalBook._id,
      }));

      await TransactionModel.insertMany(newTransactions, { session });
    }

    await session.commitTransaction();

    return newFiscalBook;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error cloning snapshot to new fiscal book:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Rollback fiscal book to a snapshot state
 * WARNING: This is a destructive operation!
 * @param {string} snapshotId - Snapshot ID
 * @param {Object} options - Rollback options
 * @param {boolean} options.createPreRollbackSnapshot - Create a snapshot before rollback (default: true)
 * @returns {Promise<Object>} Rollback result
 */
export async function rollbackToSnapshot(snapshotId, options = {}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createPreRollbackSnapshot = options.createPreRollbackSnapshot !== false;

    // 1. Get the snapshot
    const snapshot = await snapshotRepository.findSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found.');
    }

    const fiscalBookId = snapshot.originalFiscalBookId;

    // 2. Verify fiscal book exists
    const fiscalBook = await snapshotRepository.getFiscalBook(fiscalBookId);
    if (!fiscalBook) {
      throw new Error('Original fiscal book not found.');
    }

    // 3. Optionally create a pre-rollback snapshot
    let preRollbackSnapshot = null;
    if (createPreRollbackSnapshot) {
      // Need to commit first to use createFiscalBookSnapshot
      await session.commitTransaction();
      session.startTransaction();
      
      preRollbackSnapshot = await createFiscalBookSnapshot(fiscalBookId, {
        name: `Pre-rollback ${new Date().toISOString()}`,
        description: `Auto-created before rollback to snapshot "${snapshot.snapshotName}"`,
        tags: ['pre-rollback', 'auto'],
      });
    }

    // 4. Delete all current transactions
    const TransactionModel = (await import('../models/TransactionModel.js')).default;
    await TransactionModel.deleteMany({ fiscalBookId }, { session });

    // 5. Get snapshot transactions
    const transactionsResult = await snapshotRepository.getSnapshotTransactions(
      snapshotId,
      { limit: 10000 }
    );

    // 6. Recreate transactions from snapshot
    if (transactionsResult.transactions.length > 0) {
      const newTransactions = transactionsResult.transactions.map(st => ({
        ...st.transactionData,
        fiscalBookId,
      }));

      await TransactionModel.insertMany(newTransactions, { session });
    }

    // 7. Update fiscal book metadata to match snapshot
    const FiscalBookModel = (await import('../models/FiscalBookModel.js')).default;
    await FiscalBookModel.findByIdAndUpdate(
      fiscalBookId,
      {
        bookName: snapshot.fiscalBookData.bookName,
        bookType: snapshot.fiscalBookData.bookType,
        reference: snapshot.fiscalBookData.reference,
        status: snapshot.fiscalBookData.status,
        fiscalData: snapshot.fiscalBookData.fiscalData,
        notes: snapshot.fiscalBookData.notes,
        updatedAt: new Date(),
      },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      fiscalBookId,
      restoredFromSnapshot: snapshotId,
      restoredTransactionCount: transactionsResult.transactions.length,
      preRollbackSnapshotId: preRollbackSnapshot?._id,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Error rolling back to snapshot:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
}

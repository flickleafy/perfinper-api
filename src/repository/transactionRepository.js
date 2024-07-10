import TransactionModel from '../models/TransactionModel.js';
import { startSession } from 'mongoose';

export async function findPeriods() {
  try {
    return await TransactionModel.distinct('transactionPeriod');
  } catch (error) {
    console.error('Error in findPeriods:', error.message);
    throw new Error('Failed to retrieve distinct transaction periods.');
  }
}

export async function findYears() {
  try {
    let distinctYears = await TransactionModel.aggregate([
      {
        $project: {
          year: { $toString: { $year: '$transactionDate' } }, // Extract year as string
        },
      },
      {
        $group: {
          _id: null, // Group all documents
          years: { $addToSet: '$year' }, // Add distinct years to an array
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the result
          distinctYears: '$$ROOT.years', // Access years directly from root document
        },
      },
    ]);
    distinctYears = distinctYears[0].distinctYears;
    return distinctYears;
  } catch (error) {
    console.error('Error in findYears:', error.message);
    throw new Error('Failed to retrieve distinct transaction years.');
  }
}

export async function deleteAllInPeriod(period) {
  try {
    let filter = period
      ? { transactionPeriod: { $regex: new RegExp(period), $options: 'i' } }
      : {};
    await TransactionModel.deleteMany(filter);
  } catch (error) {
    console.error('Error in deleteAllInPeriod:', error.message);
    throw new Error('Failed to delete transactions in the specified period.');
  }
}

export async function deleteById(id, session = null) {
  try {
    let transaction;
    if (session) {
      transaction = await TransactionModel.findByIdAndDelete(id, {
        session,
      });
    } else {
      transaction = await TransactionModel.findByIdAndDelete(id);
    }
    if (!transaction) {
      return null;
    }
    return transaction;
  } catch (error) {
    console.error('Error in deleteById:', error.message);
    throw new Error('An error occurred while deleting the transaction by ID.');
  }
}

export async function deleteByIds(ids) {
  try {
    // Validate that the input is an array and has at least one ID
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid input: ids must be a non-empty array.');
    }

    // Delete all transactions that have an ID in the ids array
    const result = await TransactionModel.deleteMany({
      _id: { $in: ids },
    });

    // Check if any documents were deleted
    if (result.deletedCount === 0) {
      throw new Error('No transactions found with the given IDs.');
    }

    return result;
  } catch (error) {
    console.error('Error in deleteByIds:', error.message);
    throw new Error(
      'An error occurred while deleting the transactions by IDs.'
    );
  }
}

export async function updateById(id, transactionObject) {
  try {
    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      id,
      transactionObject,
      { new: true }
    );
    if (!updatedTransaction) {
      return null;
    }
    return updatedTransaction;
  } catch (error) {
    console.error('Error in updateById:', error.message);
    throw new Error('An error occurred while updating the transaction by ID.');
  }
}

export async function findAllInPeriod(period) {
  try {
    const transactions = await TransactionModel.find({
      transactionPeriod: period,
    }).sort({ transactionDate: 1 });
    return transactions;
  } catch (error) {
    console.error('Error in findAllInPeriod:', error.message);
    throw new Error('Failed to find transactions in the specified period.');
  }
}

export async function findAllInYear(year) {
  try {
    const regex = new RegExp(`^${year}-`);
    const transactions = await TransactionModel.find({
      transactionPeriod: regex,
    }).sort({ transactionDate: 1 });
    return transactions;
  } catch (error) {
    console.error('Error in findAllInYear:', error.message);
    throw new Error('Failed to find transactions in the specified year.');
  }
}

export async function findById(id, session = null) {
  try {
    let transaction;
    if (session) {
      transaction = await TransactionModel.findById(id, { session });
    } else {
      transaction = await TransactionModel.findById(id);
    }
    if (!transaction) {
      return null;
    }
    return transaction;
  } catch (error) {
    console.error('Error in findById:', error.message);
    throw new Error('An error occurred while finding the transaction by ID.');
  }
}

export async function insert(transactionObject, session = null) {
  try {
    const transaction = new TransactionModel(transactionObject);
    if (session) {
      await transaction.save({ session });
    } else {
      await transaction.save();
    }
    return transaction;
  } catch (error) {
    console.error('Error in insert:', error.message);
    throw new Error('An error occurred while inserting the transaction.');
  }
}

export async function separateById(id) {
  const session = await startSession();
  try {
    session.startTransaction();
    const transaction = await findById(id);
    const { items } = transaction;

    if (!items || items.length < 2) {
      throw new Error('Cannot separate transaction; too few items.');
    }

    const transactionPrototype = { ...transaction.toObject(), items: [] };

    for (const [index, item] of items.entries()) {
      const transactionCopy = { ...transactionPrototype, items: [item] };
      transactionCopy.transactionDescription += ` - item ${index + 1}`;

      const result = await insert(transactionCopy, session);
      if (!result.id) {
        throw new Error(
          `Failed to create separated transaction for item ${index + 1}.`
        );
      }
    }

    await deleteById(transaction.id, session);

    await session.commitTransaction();
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in separateById:', error.message);
    throw new Error('Failed to separate transactions by ID.');
  } finally {
    session.endSession();
  }
}

export async function getTransactionsIdEmptyCnpj() {
  try {
    const transactions = await TransactionModel.find({
      $or: [
        { companyCnpj: null }, // Matches explicitly null values
        { companyCnpj: { $exists: false } }, // Matches documents where companyCnpj does not exist
        { companyCnpj: '' }, // Matches empty strings
        { companyCnpj: { $type: 10 } }, // Matches values that are undefined
      ],
    })
      .sort({ transactionDate: 1 })
      .select('_id'); // Select only the transaction ID field

    return transactions.map((t) => t._id);
  } catch (error) {
    console.error('Error in getTransactionsIdEmptyCnpj:', error.message);
    throw new Error('An error occurred while retrieving transactions.');
  }
}

export async function getTransactionsIdTransactionSource(source) {
  try {
    const transactions = await TransactionModel.find({
      transactionSource: source,
    })
      .sort({ transactionDate: 1 })
      .select('_id'); // Select only the transaction ID field

    return transactions.map((t) => t._id);
  } catch (error) {
    console.error('Error in getTransactionsIdEmptyCnpj:', error.message);
    throw new Error('An error occurred while retrieving transactions.');
  }
}

export async function findCreditCardInstallments() {
  try {
    let distinctDescriptions = await TransactionModel.aggregate([
      {
        $match: {
          transactionDescription: { $regex: '\\- \\d+\\/\\d+' },
          paymentMethod: 'credit card',
        },
      },
      {
        $group: {
          _id: '$transactionDescription',
          uniqueDescriptions: { $first: '$transactionDescription' },
        },
      },
      {
        $project: {
          _id: 0,
          transactionDescription: '$uniqueDescriptions',
        },
      },
    ]);
    return distinctDescriptions;
  } catch (error) {
    console.error('Error in findCreditCardInstallments:', error.message);
    throw new Error('Failed to retrieve distinct credit card installments.');
  }
}

export async function findAllByDescription(description) {
  try {
    const regex = new RegExp(`${description}`, 'i');
    const transactions = await TransactionModel.find({
      transactionDescription: regex,
    }).sort({ transactionDate: 1 });
    return transactions;
  } catch (error) {
    console.error('Error in findAllByDescription:', error.message);
    throw new Error(
      'Failed to find transactions with the specified description.'
    );
  }
}

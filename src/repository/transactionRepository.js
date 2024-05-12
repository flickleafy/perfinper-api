import TransactionModel from '../models/TransactionModel.js';

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

export async function deleteById(id) {
  try {
    const deletedTransaction = await TransactionModel.findByIdAndDelete(id);
    if (!deletedTransaction) {
      throw new Error('No transaction found with the given ID.');
    }
    return deletedTransaction;
  } catch (error) {
    console.error('Error in deleteById:', error.message);
    throw new Error('An error occurred while deleting the transaction by ID.');
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
      throw new Error('No transaction found with the given ID.');
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

export async function findById(id) {
  try {
    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      throw new Error('No transaction found with the given ID.');
    }
    return transaction;
  } catch (error) {
    console.error('Error in findById:', error.message);
    throw new Error('An error occurred while finding the transaction by ID.');
  }
}

export async function insert(transactionObject) {
  try {
    const transaction = new TransactionModel(transactionObject);
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error in insert:', error.message);
    throw new Error('An error occurred while inserting the transaction.');
  }
}

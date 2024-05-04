import TransactionModel from '../models/TransactionModel.js';

export async function findPeriods() {
  try {
    return await TransactionModel.distinct('transactionPeriod');
  } catch (error) {
    console.error('Error in findPeriods:', error);
    throw new Error('An error occurred while finding periods.');
  }
}

export async function deleteAllInPeriod(period) {
  try {
    let filter = period
      ? { name: { $regex: new RegExp(period), $options: 'i' } }
      : {};
    await TransactionModel.deleteMany(filter);
  } catch (error) {
    console.error('Error in deleteAllInPeriod:', error);
    throw new Error(
      'An error occurred while deleting all transactions in the period.'
    );
  }
}

export async function deleteById(id) {
  try {
    return await TransactionModel.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteById:', error);
    throw new Error('An error occurred while deleting the transaction by ID.');
  }
}

export async function updateById(id, transactionObject) {
  try {
    return await TransactionModel.findByIdAndUpdate(id, transactionObject, {
      new: true,
    });
  } catch (error) {
    console.error('Error in updateById:', error);
    throw new Error('An error occurred while updating the transaction by ID.');
  }
}

export async function findAllInPeriod(period) {
  try {
    return await TransactionModel.find({ transactionPeriod: period }).sort({
      day: 1,
    });
  } catch (error) {
    console.error('Error in findAllInPeriod:', error);
    throw new Error(
      'An error occurred while finding all transactions in the period.'
    );
  }
}

export async function findById(id) {
  try {
    return await TransactionModel.findById(id);
  } catch (error) {
    console.error('Error in findById:', error);
    throw new Error('An error occurred while finding the transaction by ID.');
  }
}

export async function insert(transactionObject) {
  try {
    const transaction = new TransactionModel(transactionObject);
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error in insert:', error);
    throw new Error('An error occurred while inserting the transaction.');
  }
}

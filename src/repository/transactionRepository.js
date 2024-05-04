import TransactionModel from '../models/TransactionModel.js';

export async function findPeriods() {
  return await TransactionModel.distinct('transactionPeriod');
}
export async function deleteAllInPeriod(period) {
  let filter = period
    ? { name: { $regex: new RegExp(period), $options: 'i' } }
    : {};
  await TransactionModel.deleteMany(filter);
}
export async function deleteById(id) {
  return await TransactionModel.findByIdAndDelete(id);
}
export async function updateById(id, transactionObject) {
  return await TransactionModel.findByIdAndUpdate(id, transactionObject, {
    new: true,
  });
}
export async function findAllInPeriod(period) {
  return await TransactionModel.find({
    transactionPeriod: period,
  }).sort({ day: 1 });
}
export async function findById(id) {
  return await TransactionModel.findById(id);
}
export async function insert(transactionObject) {
  const transaction = new TransactionModel(transactionObject);
  await transaction.save();
  return transaction;
}

import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
  transactionDate: { type: Date, default: Date.now },
  transactionPeriod: String,
  totalValue: String,
  individualValue: String,
  freightValue: String,
  itemName: String,
  itemDescription: String,
  itemUnits: Number,
  transactionLocation: String,
  transactionType: { type: String, enum: ['credit', 'debit'] },
  transactionCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
  },
  groupedItem: Boolean,
  groupedItemsReference: String, // Shared Reference
  transactionFiscalNote: String,
  transactionId: String,
  transactionStatus: String,
  companyName: String,
  companySellerName: String,
  companyCnpj: String,
  transactionSource: String,
});

const transformTransactionFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id; // Delete _id from the response
  delete ret.__v; // Optional: delete version key if not needed
  return ret;
};

// Ensure that _id and __v is not returned
transactionSchema.set('toJSON', {
  transform: transformTransactionFields,
});

transactionSchema.set('toObject', {
  transform: transformTransactionFields,
});

const TransactionModel = mongoose.model('transaction', transactionSchema);

export default TransactionModel;

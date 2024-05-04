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
  transactionOrigin: String,
});

const TransactionModel = mongoose.model('transaction', transactionSchema);

export default TransactionModel;

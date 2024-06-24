import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
  transactionDate: { type: Date, default: Date.now },
  transactionPeriod: String, // month and year of transaction
  transactionSource: String, // manual, nubank, digio, mercadolivre, flash
  transactionValue: String,
  transactionName: String, // brief description/name about the transaction
  transactionDescription: String, // detailed information about the transaction
  transactionFiscalNote: String, // fiscal note key
  transactionId: { type: String, index: true }, // transaction id from the transaction source
  transactionStatus: { type: String, index: true }, // concluded, refunded, started
  transactionLocation: {
    type: String,
    enum: ['online', 'local', 'other'],
  },
  transactionType: { type: String, enum: ['credit', 'debit'] },
  transactionInstallments: String,
  installments: {
    installmentsAmount: String,
    installmentsInformation: [
      { installmentDate: { type: Date }, installmentValue: String },
    ],
  },
  transactionCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
  }, // category id
  freightValue: String, // only applicable for online transaction of physical product
  paymentMethod: {
    type: String,
    enum: [
      'money',
      'pix',
      'boleto',
      'debit card',
      'credit card',
      'benefit card',
      'other',
    ],
  },
  items: [
    {
      itemName: String, // brief description/name about the item
      itemDescription: String, // detailed information about the item
      itemValue: String, // individual value of item
      itemUnits: { type: Number, min: 1 }, // amount of units of the same item
    },
  ],
  companyName: String, // company name
  companySellerName: String, // seller name from the company
  companyCnpj: { type: String, index: true }, // company identification key
});

const transformTransactionFields = (doc, ret, options) => {
  ret.id = ret._id;
  if (ret.totalValue) {
    ret.transactionValue = ret.totalValue;
    delete ret.totalValue;
  }
  if (ret.itemDescription) {
    ret.transactionDescription = ret.itemDescription;
    delete ret.itemDescription;
  }
  if (ret.itemName) {
    ret.transactionName = ret.itemName;
    delete ret.itemName;
  }
  if (!ret.transactionLocation) {
    ret.transactionLocation = 'other';
  }
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

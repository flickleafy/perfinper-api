import mongoose from 'mongoose';

/**
 * Schema for Snapshot Transactions
 * Stores individual transaction copies associated with a snapshot.
 * Each transaction is a complete copy of the original at snapshot time.
 */
const snapshotTransactionSchema = new mongoose.Schema({
  // Reference to the snapshot
  snapshotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fiscalBookSnapshot',
    required: true,
    index: true,
  },

  // Original transaction ID (for comparison purposes)
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transaction',
    index: true,
  },

  // Transaction-level annotations/notes
  annotations: [{
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: String, // user ID or name
  }],

  // Complete copy of transaction data at snapshot time
  transactionData: {
    transactionDate: Date,
    transactionPeriod: String,
    transactionSource: String,
    transactionValue: String,
    transactionName: String,
    transactionDescription: String,
    transactionFiscalNote: String,
    transactionId: String,
    transactionStatus: String,
    transactionLocation: {
      type: String,
      enum: ['online', 'local', 'other'],
    },
    transactionType: {
      type: String,
      enum: ['credit', 'debit'],
    },
    transactionInstallments: String,
    installments: {
      installmentsAmount: String,
      installmentsInformation: [{
        installmentDate: Date,
        installmentValue: String,
      }],
    },
    transactionCategory: mongoose.Schema.Types.ObjectId,
    freightValue: String,
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
    items: [{
      itemName: String,
      itemDescription: String,
      itemValue: String,
      itemUnits: Number,
    }],
    companyName: String,
    companySellerName: String,
    companyCnpj: String,
    companyId: mongoose.Schema.Types.ObjectId,
  },

  // Timestamp when transaction was copied
  copiedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient snapshot transaction lookups
snapshotTransactionSchema.index({ snapshotId: 1, originalTransactionId: 1 });

// Transform function for JSON output
const transformSnapshotTransactionFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

// Ensure that _id and __v are not returned
snapshotTransactionSchema.set('toJSON', {
  transform: transformSnapshotTransactionFields,
});

snapshotTransactionSchema.set('toObject', {
  transform: transformSnapshotTransactionFields,
});

const SnapshotTransactionModel = mongoose.model('snapshotTransaction', snapshotTransactionSchema);

export default SnapshotTransactionModel;

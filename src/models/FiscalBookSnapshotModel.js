import mongoose from 'mongoose';

/**
 * Schema for Fiscal Book Snapshots
 * A snapshot is a complete, independent, immutable copy of a fiscal book at a specific point in time.
 */
const fiscalBookSnapshotSchema = new mongoose.Schema({
  // Reference to the original fiscal book
  originalFiscalBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fiscalBook',
    required: true,
    index: true,
  },

  // Snapshot metadata
  snapshotName: {
    type: String,
    trim: true,
    default: () => `Snapshot ${new Date().toISOString().split('T')[0]}`,
  },
  snapshotDescription: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },

  // Creation source (manual or automatic)
  creationSource: {
    type: String,
    enum: ['manual', 'scheduled', 'before-status-change'],
    default: 'manual',
  },

  // Tags for organization and filtering
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  }],

  // Protection flag to prevent accidental deletion
  isProtected: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Snapshot-level annotations/notes
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

  // Complete copy of fiscal book data at snapshot time
  fiscalBookData: {
    bookName: String,
    bookType: String,
    bookPeriod: String,
    reference: String,
    status: String,
    fiscalData: Object,
    companyId: mongoose.Schema.Types.ObjectId,
    notes: String,
    createdAt: Date,
    updatedAt: Date,
    closedAt: Date,
  },

  // Snapshot statistics (computed at creation time)
  statistics: {
    transactionCount: {
      type: Number,
      default: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
  },
});

// Index for tag-based queries
fiscalBookSnapshotSchema.index({ tags: 1, createdAt: -1 });

// Index for finding snapshots by original fiscal book sorted by date
fiscalBookSnapshotSchema.index({ originalFiscalBookId: 1, createdAt: -1 });

// Transform function for JSON output
const transformSnapshotFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

// Ensure that _id and __v are not returned
fiscalBookSnapshotSchema.set('toJSON', {
  transform: transformSnapshotFields,
});

fiscalBookSnapshotSchema.set('toObject', {
  transform: transformSnapshotFields,
});

const FiscalBookSnapshotModel = mongoose.model('fiscalBookSnapshot', fiscalBookSnapshotSchema);

export default FiscalBookSnapshotModel;

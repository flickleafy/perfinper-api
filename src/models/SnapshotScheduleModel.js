import mongoose from 'mongoose';

/**
 * Schema for Snapshot Schedules
 * Configures automatic snapshot creation for fiscal books.
 */
const snapshotScheduleSchema = new mongoose.Schema({
  // Reference to the fiscal book
  fiscalBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fiscalBook',
    required: true,
    unique: true, // One schedule per fiscal book
    index: true,
  },

  // Whether scheduling is enabled
  enabled: {
    type: Boolean,
    default: false,
  },

  // Schedule frequency
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'before-status-change'],
    default: 'monthly',
  },

  // Day of week (0-6, 0=Sunday) for weekly schedules
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
  },

  // Day of month (1-31) for monthly schedules
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1,
  },

  // Retention: max number of auto-snapshots to keep
  retentionCount: {
    type: Number,
    default: 12,
    min: 1,
    max: 100,
  },

  // Tags to automatically apply to scheduled snapshots
  autoTags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // Last execution timestamp
  lastExecutedAt: Date,

  // Next scheduled execution
  nextExecutionAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
snapshotScheduleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Transform function for JSON output
const transformScheduleFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

// Ensure that _id and __v are not returned
snapshotScheduleSchema.set('toJSON', {
  transform: transformScheduleFields,
});

snapshotScheduleSchema.set('toObject', {
  transform: transformScheduleFields,
});

const SnapshotScheduleModel = mongoose.model('snapshotSchedule', snapshotScheduleSchema);

export default SnapshotScheduleModel;

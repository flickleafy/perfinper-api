import mongoose from 'mongoose';

/**
 * Schema for Fiscal Book entities
 * This schema represents fiscal books that contain related transactions
 */
const fiscalBookSchema = new mongoose.Schema({
  // Basic fiscal book information
  bookName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  // Book type (e.g., Entrada, Saída, Serviços, etc.)
  bookType: {
    type: String,
    required: true,
    enum: ['Entrada', 'Saída', 'Serviços', 'Inventário', 'Outros'],
    default: 'Outros',
    index: true,
  },

  // Book period (YYYY-MM format or YYYY for annual books)
  bookPeriod: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  // Book reference (e.g. a tax identification or internal reference)
  reference: {
    type: String,
    trim: true,
  },

  // Book status
  status: {
    type: String,
    enum: ['Aberto', 'Fechado', 'Em Revisão', 'Arquivado'],
    default: 'Aberto',
    index: true,
  },

  // Fiscal information
  fiscalData: {
    taxAuthority: String,
    fiscalYear: Number,
    fiscalPeriod: String, // Could be monthly, quarterly, annual
    taxRegime: {
      type: String,
      enum: ['Simples Nacional', 'Lucro Real', 'Lucro Presumido', 'Outro'],
      default: 'Simples Nacional',
    },
    submissionDate: Date,
    dueDate: Date,
  },

  // Company information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'company',
    index: true,
  },

  // Notes and metadata
  notes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: Date,
});

// Update the updatedAt field before saving
fiscalBookSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Transform function for JSON output
const transformFiscalBookFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

// Ensure that _id and __v are not returned
fiscalBookSchema.set('toJSON', {
  transform: transformFiscalBookFields,
});

fiscalBookSchema.set('toObject', {
  transform: transformFiscalBookFields,
});

const FiscalBookModel = mongoose.model('fiscalBook', fiscalBookSchema);

export default FiscalBookModel;

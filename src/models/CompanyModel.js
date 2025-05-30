import mongoose from 'mongoose';

const companySchema = mongoose.Schema({
  // Basic company information (from TransactionModel.js)
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  companyCnpj: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  companySellerName: {
    type: String,
    trim: true,
  },

  // Registration information (from CompanyModel.md)
  corporateName: {
    // razaoSocial
    type: String,
    trim: true,
  },
  tradeName: {
    // nomeFantasia
    type: String,
    trim: true,
  },
  foundationDate: {
    // dataAbertura
    type: Date,
  },
  companySize: {
    // porte
    type: String,
    trim: true,
  },
  legalNature: {
    // naturezaJuridica
    type: String,
    trim: true,
  },
  microEntrepreneurOption: {
    // opcaoMei
    type: Boolean,
    default: false,
  },
  simplifiedTaxOption: {
    // opcaoSimples
    type: Boolean,
    default: false,
  },
  shareCapital: {
    // capitalSocial
    type: String,
    trim: true,
  },
  companyType: {
    // tipo
    type: String,
    enum: ['Matriz', 'Filial'], // Headquarters, Branch
    trim: true,
  },
  status: {
    // situacao
    type: String,
    enum: ['Ativa', 'Inativa', 'Suspensa', 'Baixada'], // Active, Inactive, Suspended, Closed
    default: 'Ativa',
    index: true,
  },
  statusDate: {
    // dataSituacaoCadastral
    type: Date,
  },

  // Contact information
  contacts: {
    // contatos
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phones: [
      // telefones
      {
        type: String,
        trim: true,
      },
    ],
  },

  // Address information
  address: {
    // endereco
    street: {
      // logradouro
      type: String,
      trim: true,
    },
    complement: {
      // complemento
      type: String,
      trim: true,
    },
    neighborhood: {
      // bairro
      type: String,
      trim: true,
    },
    zipCode: {
      // cep
      type: String,
      trim: true,
    },
    city: {
      // municipio
      type: String,
      trim: true,
      index: true,
    },
    state: {
      // estado
      type: String,
      trim: true,
      index: true,
    },
  },

  // Business activities (CNAE)
  activities: {
    // atividades
    primary: {
      // principal
      code: {
        // codigo
        type: String,
        trim: true,
      },
      description: {
        // descricao
        type: String,
        trim: true,
      },
    },
    secondary: [
      // secundarias
      {
        code: {
          // codigo
          type: String,
          trim: true,
        },
        description: {
          // descricao
          type: String,
          trim: true,
        },
      },
    ],
  },

  // Partners and administrators
  corporateStructure: [
    // quadroSocietario
    {
      name: {
        // nome
        type: String,
        trim: true,
      },
      type: {
        // tipo
        type: String,
        enum: ['Administrador', 'Sócio', 'Procurador'], // Administrator, Partner, Attorney
        trim: true,
      },
      cnpj: {
        type: String,
        trim: true,
      },
      country: {
        // pais
        type: String,
        trim: true,
      },
    },
  ],

  // Additional metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Transaction statistics (calculated fields)
  statistics: {
    // estatisticas
    totalTransactions: {
      // totalTransacoes
      type: Number,
      default: 0,
    },
    totalTransactionValue: {
      // valorTotalTransacoes
      type: String,
      default: '0',
    },
    lastTransaction: {
      // ultimaTransacao
      type: Date,
    },
  },
});

// Indexes for better query performance
companySchema.index({ companyCnpj: 1 });
companySchema.index({ companyName: 1 });
companySchema.index({ situacao: 1 });
companySchema.index({ 'address.city': 1, 'address.state': 1 });

// Update the updatedAt field before saving
companySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Transform function for JSON output
const transformCompanyFields = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

// Ensure that _id and __v are not returned
companySchema.set('toJSON', {
  transform: transformCompanyFields,
});

companySchema.set('toObject', {
  transform: transformCompanyFields,
});

const CompanyModel = mongoose.model('company', companySchema);

export default CompanyModel;

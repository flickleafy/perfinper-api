import mongoose from 'mongoose';

/**
 * Schema for Person (Individual) entities
 * This schema represents individual people (CPF holders) that may appear in transactions
 */
const PersonSchema = new mongoose.Schema(
  {
    // Identificação pessoal (Personal identification)
    fullName: {
      type: String,
      required: true,
      trim: true,
      comment: 'nomeCompleto - Nome completo da pessoa',
    },

    cpf: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      comment: 'cpf - Cadastro de Pessoa Física',
    },

    rg: {
      type: String,
      trim: true,
      comment: 'rg - Registro Geral',
    },

    // Informações de contato (Contact information)
    contacts: {
      emails: [
        {
          type: String,
          trim: true,
          lowercase: true,
          comment: 'emails - Endereços de email',
        },
      ],

      phones: [
        {
          type: String,
          trim: true,
          comment: 'telefones - Números de telefone',
        },
      ],

      cellphones: [
        {
          type: String,
          trim: true,
          comment: 'celulares - Números de telefone celular',
        },
      ],
    },

    // Endereço (Address)
    address: {
      street: {
        type: String,
        trim: true,
        comment: 'rua - Logradouro',
      },

      number: {
        type: String,
        trim: true,
        comment: 'numero - Número do endereço',
      },

      complement: {
        type: String,
        trim: true,
        comment: 'complemento - Complemento do endereço',
      },

      neighborhood: {
        type: String,
        trim: true,
        comment: 'bairro - Bairro',
      },

      city: {
        type: String,
        trim: true,
        comment: 'cidade - Cidade',
      },

      state: {
        type: String,
        trim: true,
        comment: 'estado - Estado/UF',
      },

      zipCode: {
        type: String,
        trim: true,
        comment: 'cep - Código de Endereçamento Postal',
      },

      country: {
        type: String,
        trim: true,
        default: 'Brasil',
        comment: 'pais - País',
      },
    },

    // Informações pessoais (Personal information)
    dateOfBirth: {
      type: Date,
      comment: 'dataDeNascimento - Data de nascimento',
    },

    profession: {
      type: String,
      trim: true,
      comment: 'profissao - Profissão principal',
    },

    // Informações do negócio pessoal (Personal business information)
    personalBusiness: {
      hasPersonalBusiness: {
        type: Boolean,
        default: false,
        comment:
          'temNegocioProprio - Indica se a pessoa possui negócio próprio',
      },

      businessType: {
        type: String,
        enum: [
          'taxi',
          'uber',
          'delivery',
          'freelancer',
          'consultant',
          'teacher',
          'tutor',
          'hairdresser',
          'mechanic',
          'electrician',
          'plumber',
          'carpenter',
          'painter',
          'cleaner',
          'gardener',
          'street_vendor',
          'food_vendor',
          'artisan',
          'photographer',
          'musician',
          'artist',
          'writer',
          'translator',
          'developer',
          'designer',
          'other',
        ],
        comment: 'tipoNegocio - Tipo de negócio informal/pessoal',
      },

      businessName: {
        type: String,
        trim: true,
        comment: 'nomeNegocio - Nome fantasia do negócio',
      },

      businessDescription: {
        type: String,
        trim: true,
        comment: 'descricaoNegocio - Descrição detalhada da atividade',
      },

      businessCategory: {
        type: String,
        enum: [
          'transport',
          'education',
          'beauty',
          'construction',
          'maintenance',
          'food_service',
          'retail',
          'services',
          'technology',
          'arts',
          'health',
          'consulting',
          'other',
        ],
        comment: 'categoriaNegocio - Categoria do negócio',
      },

      isFormalized: {
        type: Boolean,
        default: false,
        comment: 'ehFormalizado - Se o negócio é formalizado (MEI, etc.)',
      },

      mei: {
        type: String,
        trim: true,
        comment: 'mei - Número do MEI (Microempreendedor Individual)',
      },

      workingHours: {
        type: String,
        trim: true,
        comment: 'horarioTrabalho - Horário de funcionamento',
      },

      serviceArea: {
        type: String,
        trim: true,
        comment: 'areaAtendimento - Área geográfica de atendimento',
      },

      averageMonthlyRevenue: {
        type: Number,
        min: 0,
        comment: 'faturamentoMedio - Faturamento médio mensal',
      },

      businessNotes: {
        type: String,
        trim: true,
        comment: 'observacoesNegocio - Observações sobre o negócio',
      },
    },

    bankAccounts: [
      {
        bank: {
          type: String,
          trim: true,
          comment: 'banco - Nome do banco',
        },

        agency: {
          type: String,
          trim: true,
          comment: 'agencia - Agência bancária',
        },

        account: {
          type: String,
          trim: true,
          comment: 'conta - Número da conta',
        },

        accountType: {
          type: String,
          enum: ['checking', 'savings', 'investment'],
          comment:
            'tipoConta - Tipo da conta (corrente, poupança, investimento)',
        },
      },
    ],

    // Metadados (Metadata)
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
      comment: 'status - Status da pessoa no sistema',
    },

    notes: {
      type: String,
      trim: true,
      comment: 'observacoes - Observações adicionais',
    },

    // Campos de auditoria (Audit fields)
    createdAt: {
      type: Date,
      default: Date.now,
      comment: 'criadoEm - Data de criação do registro',
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      comment: 'atualizadoEm - Data da última atualização',
    },

    // Rastreamento de origem (Source tracking)
    sourceTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      comment: 'transacaoOrigem - Transação que originou este registro',
    },
  },
  {
    collection: 'people',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para otimização de consultas (Indexes for query optimization)
PersonSchema.index({ cpf: 1 });
PersonSchema.index({ fullName: 1 });
PersonSchema.index({ 'address.city': 1 });
PersonSchema.index({ 'address.state': 1 });
PersonSchema.index({ status: 1 });
PersonSchema.index({ createdAt: -1 });

// Personal business indexes
PersonSchema.index({ 'personalBusiness.hasPersonalBusiness': 1 });
PersonSchema.index({ 'personalBusiness.businessType': 1 });
PersonSchema.index({ 'personalBusiness.businessCategory': 1 });
PersonSchema.index({ 'personalBusiness.isFormalized': 1 });
PersonSchema.index({
  'personalBusiness.hasPersonalBusiness': 1,
  'personalBusiness.businessType': 1,
});
PersonSchema.index({
  'personalBusiness.hasPersonalBusiness': 1,
  'personalBusiness.businessCategory': 1,
});

// Middleware para atualizar updatedAt (Middleware to update updatedAt)
PersonSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual para nome de exibição (Virtual for display name)
PersonSchema.virtual('displayName').get(function () {
  return this.fullName || 'Pessoa sem nome';
});

// Virtual para endereço completo (Virtual for complete address)
PersonSchema.virtual('fullAddress').get(function () {
  if (!this.address) return '';

  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.number) parts.push(this.address.number);
  if (this.address.neighborhood) parts.push(this.address.neighborhood);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(`CEP: ${this.address.zipCode}`);

  return parts.join(', ');
});

// Virtual para contato principal (Virtual for primary contact)
PersonSchema.virtual('primaryContact').get(function () {
  if (
    this.contacts &&
    this.contacts.emails &&
    this.contacts.emails.length > 0
  ) {
    return this.contacts.emails[0];
  }
  if (
    this.contacts &&
    this.contacts.phones &&
    this.contacts.phones.length > 0
  ) {
    return this.contacts.phones[0];
  }
  if (
    this.contacts &&
    this.contacts.cellphones &&
    this.contacts.cellphones.length > 0
  ) {
    return this.contacts.cellphones[0];
  }
  return null;
});

const PersonModel = mongoose.model('Person', PersonSchema);

export default PersonModel;

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
      comment: 'profissao - Profissão',
    },

    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'other'],
      comment:
        'estadoCivil - Estado civil (solteiro, casado, divorciado, viúvo, outro)',
    },

    // Informações financeiras (Financial information)
    monthlyIncome: {
      type: Number,
      min: 0,
      comment: 'rendaMensal - Renda mensal',
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

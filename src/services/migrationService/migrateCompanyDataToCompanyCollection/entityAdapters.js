/**
 * Entity Adapters
 * Implements Factory and Adapter patterns for converting transaction data to entity objects
 * Separates data transformation logic from business logic
 */

import { formatCPF } from '../../../infrastructure/validators/index.js';
import { ENTITY_STATUS } from './types.js';

/**
 * Company Data Adapter
 * Transforms transaction data into company entity structure
 */
export class CompanyAdapter {
  /**
   * Creates a company object from transaction data
   * @param {Object} transaction - Transaction containing company CNPJ information
   * @returns {Object|null} Company data object or null if insufficient data
   */
  static fromTransaction(transaction) {
    if (
      !transaction ||
      !transaction.companyCnpj ||
      transaction.companyCnpj.trim() === ''
    ) {
      return null;
    }

    return {
      // Basic company information
      companyName: transaction.companyName || '',
      companyCnpj: transaction.companyCnpj || '',

      // Registration information
      corporateName: transaction.companyName || '',
      tradeName: transaction.companyName || '',
      foundationDate: null,
      companySize: '',
      legalNature: '',
      microEntrepreneurOption: false,
      simplifiedTaxOption: false,
      shareCapital: '',
      companyType: 'Matriz',
      status: 'Ativa', // Using enum value from CompanyModel: 'Ativa', 'Inativa', 'Suspensa', 'Baixada'
      statusDate: null,

      // Contact information
      contacts: {
        email: '',
        phones: [],
        website: '',
        socialMedia: [],
      },

      // Address information
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        zipCode: '',
        city: '',
        state: '',
        country: 'Brasil',
      },

      // Business activities
      activities: {
        primary: {
          code: '',
          description: '',
        },
        secondary: [],
      },

      // Corporate structure - following the exact schema
      corporateStructure: transaction.companySellerName
        ? [
            {
              name: transaction.companySellerName || '',
              type: 'Vendedor', // Using the enum value from CompanyModel
              cnpj: '',
              country: 'Brasil',
            },
          ]
        : [],

      // Transaction statistics
      statistics: {
        totalTransactions: 0,
        totalTransactionValue: '0',
        lastTransaction: null,
      },

      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceTransaction: transaction._id,
    };
  }
}

/**
 * Person Data Adapter
 * Transforms transaction data into person entity structure
 */
export class PersonAdapter {
  /**
   * Creates a person object from transaction data
   * @param {Object} transaction - Transaction containing person data
   * @returns {Object|null} Person data object or null
   */
  static fromTransaction(transaction) {
    if (!transaction.companyCnpj) {
      return null;
    }

    const personData = {
      fullName:
        transaction.companyName ||
        transaction.companySellerName ||
        'Nome não informado',
      cpf: formatCPF(transaction.companyCnpj),
      status: ENTITY_STATUS.ACTIVE,
      sourceTransaction: transaction._id,
      personalBusiness: {
        hasPersonalBusiness: false, // Default - no business info from transaction
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add seller name as additional info if different from company name
    if (
      transaction.companySellerName &&
      transaction.companySellerName !== transaction.companyName
    ) {
      personData.notes = `Nome do vendedor: ${transaction.companySellerName}`;
    }

    return personData;
  }
}

/**
 * Anonymous Person Data Adapter
 * Transforms transaction data with anonymized CPF into anonymous person structure
 */
export class AnonymousPersonAdapter {
  /**
   * Creates an anonymous person object from transaction data
   * @param {Object} transaction - Transaction containing anonymized person data
   * @returns {Object|null} Anonymous person data object or null
   */
  static fromTransaction(transaction) {
    if (!transaction.companyCnpj) {
      return null;
    }

    const personData = {
      fullName:
        transaction.companyName ||
        transaction.companySellerName ||
        'Pessoa Anônima',
      cpf: transaction.companyCnpj, // Keep the anonymized CPF as-is
      status: ENTITY_STATUS.ANONYMOUS, // Special status for anonymized persons
      notes: 'Pessoa criada a partir de CPF anonimizado em transação',
      sourceTransaction: transaction._id,

      // Mark as having limited data due to anonymization
      personalBusiness: {
        hasPersonalBusiness: false, // Cannot determine business info from anonymized data
      },

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add seller name as additional info if different from company name
    if (
      transaction.companySellerName &&
      transaction.companySellerName !== transaction.companyName
    ) {
      personData.notes += `. Vendedor: ${transaction.companySellerName}`;
    }

    return personData;
  }
}

/**
 * Entity Factory
 * Factory pattern implementation for creating entities based on document type
 */
export class EntityFactory {
  /**
   * Creates an entity from transaction based on document type
   * @param {Object} transaction - Transaction data
   * @param {string} documentType - Type of document (CNPJ, CPF, ANONYMIZED_CPF)
   * @returns {Object|null} Entity data or null
   */
  static createEntity(transaction, documentType) {
    switch (documentType) {
      case 'cnpj':
        return CompanyAdapter.fromTransaction(transaction);
      case 'cpf':
        return PersonAdapter.fromTransaction(transaction);
      case 'anonymized_cpf':
        return AnonymousPersonAdapter.fromTransaction(transaction);
      default:
        return null;
    }
  }
}

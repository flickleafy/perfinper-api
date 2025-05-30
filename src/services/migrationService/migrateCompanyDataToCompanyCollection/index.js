import mongoose from 'mongoose';
import {
  findAllWithCompanyCnpj as findAllTransactionsWithCompany,
  updateById as updateTransaction,
} from '../../../repository/transactionRepository.js';
import {
  findByCnpj,
  insert as insertCompany,
} from '../../../repository/companyRepository.js';
import {
  findByCpf,
  insert as insertPerson,
} from '../../../repository/personRepository.js';
import {
  identifyDocumentType,
  formatCPF,
} from '../../../infrasctructure/validators/index.js';

/**
 * Migrates company and person data from transactions to their respective collections
 * Extracts unique companies (CNPJ) and persons (CPF) based on document identifiers
 * Prevents duplicates and enriches entity data over time
 * Uses MongoDB transactions to ensure data consistency
 */
export const migrateCompanyDataToCompanyCollection = async () => {
  const session = await mongoose.startSession();

  try {
    console.log(
      '🏢 Starting company and person data migration from transactions with CNPJ/CPF...'
    );

    const transactions = await findAllTransactionsWithCompany();
    console.log(
      `📊 Found ${transactions.length} transactions with CNPJ/CPF to analyze`
    );

    if (transactions.length === 0) {
      console.log('ℹ️ No transactions found. Migration completed.');
      return { success: true, companiesCreated: 0, companiesUpdated: 0 };
    }

    // Start MongoDB transaction
    let migrationResult;
    await session.withTransaction(async () => {
      migrationResult = await processTransactionsWithSession(
        transactions,
        session
      );
    });

    console.log('🎉 Company and person data migration completed!');
    console.log(`📈 Summary:`, migrationResult);

    return migrationResult;
  } catch (error) {
    console.error('💥 Error during company and person data migration:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Processes all transactions to extract and create companies with MongoDB session
 * @param {Array} transactions - Array of transactions to process
 * @param {Object} session - MongoDB session for transaction
 * @returns {Object} Migration summary with counts and statistics
 */
async function processTransactionsWithSession(transactions, session) {
  const processedEntities = new Map();
  const stats = {
    success: true,
    transactionsAnalyzed: transactions.length,
    companiesCreated: 0,
    companiesUpdated: 0,
    companiesSkipped: 0,
    uniqueCompaniesProcessed: 0,
  };

  for (const transaction of transactions) {
    try {
      const result = await processTransactionWithSession(
        transaction,
        processedEntities,
        session
      );
      stats.companiesCreated += result.created;
      stats.companiesSkipped += result.skipped;
      stats.companiesUpdated += result.updated;
    } catch (error) {
      console.error(
        `❌ Error processing transaction ${transaction.id}:`,
        error.message
      );
      throw error; // Rethrow to trigger transaction rollback
    }
  }

  stats.uniqueCompaniesProcessed = processedEntities.size;
  return stats;
}

/**
 * Processes a single transaction to extract company or person data with MongoDB session
 * @param {Object} transaction - Transaction to process
 * @param {Map} processedEntities - Map of already processed entities (companies/persons)
 * @param {Object} session - MongoDB session for transaction
 * @returns {Object} Result with created/skipped/updated counts
 */
async function processTransactionWithSession(
  transaction,
  processedEntities,
  session
) {
  // Skip transactions without company data
  if (!hasCompanyData(transaction)) {
    return { created: 0, skipped: 0, updated: 0 };
  }

  const entityIdentifier = getEntityIdentifier(transaction);

  // Validate and identify document type (CNPJ/CPF)
  const documentInfo = identifyDocumentType(entityIdentifier);

  if (!documentInfo.isValid) {
    console.log(`⚠️ Invalid document identifier: ${entityIdentifier}`);
    return { created: 0, skipped: 0, updated: 0 };
  }

  // Skip if already processed in this migration
  if (processedEntities.has(entityIdentifier)) {
    return { created: 0, skipped: 0, updated: 0 };
  }

  // Process based on document type
  if (documentInfo.type === 'cnpj') {
    return await processCompanyTransaction(
      transaction,
      processedEntities,
      session
    );
  } else if (documentInfo.type === 'cpf') {
    return await processPersonTransaction(
      transaction,
      processedEntities,
      session
    );
  }

  return { created: 0, skipped: 0, updated: 0 };
}

/**
 * Processes company transactions (CNPJ)
 * @param {Object} transaction - Transaction to process
 * @param {Map} processedEntities - Map of already processed entities
 * @param {Object} session - MongoDB session for transaction
 * @returns {Object} Result with created/skipped/updated counts
 */
async function processCompanyTransaction(
  transaction,
  processedEntities,
  session
) {
  const companyIdentifier = getEntityIdentifier(transaction);

  const existingCompany = await findExistingCompanyWithSession(
    transaction,
    session
  );

  if (existingCompany) {
    console.log(
      `✅ Company already exists: ${
        existingCompany.corporateName || existingCompany.tradeName
      }`
    );
    // Update transaction with companyId if not already set
    const updateResult = await updateTransactionWithCompanyIdSession(
      transaction,
      existingCompany.id,
      session
    );
    processedEntities.set(companyIdentifier, true);
    return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
  }

  // Create new company
  const newCompanyData = createCompanyFromTransaction(transaction);
  if (newCompanyData) {
    const createdCompany = await insertCompanyWithSession(
      newCompanyData,
      session
    );
    console.log(
      `🆕 Created company: ${
        newCompanyData.corporateName || newCompanyData.tradeName
      }`
    );
    // Update transaction with the new companyId
    const updateResult = await updateTransactionWithCompanyIdSession(
      transaction,
      createdCompany.id,
      session
    );
    processedEntities.set(companyIdentifier, true);
    return { created: 1, skipped: 0, updated: updateResult ? 1 : 0 };
  }

  return { created: 0, skipped: 0, updated: 0 };
}

/**
 * Processes person transactions (CPF)
 * @param {Object} transaction - Transaction to process
 * @param {Map} processedEntities - Map of already processed entities
 * @param {Object} session - MongoDB session for transaction
 * @returns {Object} Result with created/skipped/updated counts
 */
async function processPersonTransaction(
  transaction,
  processedEntities,
  session
) {
  const personIdentifier = getEntityIdentifier(transaction);

  const existingPerson = await findExistingPersonWithSession(
    transaction,
    session
  );

  if (existingPerson) {
    console.log(`✅ Person already exists: ${existingPerson.fullName}`);
    // Update transaction with personId if not already set
    const updateResult = await updateTransactionWithPersonIdSession(
      transaction,
      existingPerson.id,
      session
    );
    processedEntities.set(personIdentifier, true);
    return { created: 0, skipped: 1, updated: updateResult ? 1 : 0 };
  }

  // Create new person
  const newPersonData = createPersonFromTransaction(transaction);
  if (newPersonData) {
    const createdPerson = await insertPersonWithSession(newPersonData, session);
    console.log(`🆕 Created person: ${newPersonData.fullName}`);
    // Update transaction with the new personId
    const updateResult = await updateTransactionWithPersonIdSession(
      transaction,
      createdPerson.id,
      session
    );
    processedEntities.set(personIdentifier, true);
    return { created: 1, skipped: 0, updated: updateResult ? 1 : 0 };
  }

  return { created: 0, skipped: 0, updated: 0 };
}

/**
 * Checks if transaction has company CNPJ/CPF data
 * @param {Object} transaction - Transaction to check
 * @returns {boolean} True if has company CNPJ/CPF
 */
function hasCompanyData(transaction) {
  return !!(transaction.companyCnpj && transaction.companyCnpj.trim() !== '');
}

/**
 * Gets unique identifier for an entity (company/person) from transaction
 * @param {Object} transaction - Transaction with company CNPJ/CPF data
 * @returns {string} Unique entity identifier (CNPJ/CPF)
 */
function getEntityIdentifier(transaction) {
  return transaction.companyCnpj;
}

/**
 * Finds existing company in database by CNPJ with session
 * @param {Object} transaction - Transaction with company CNPJ data
 * @param {Object} session - MongoDB session
 * @returns {Object|null} Existing company or null
 */
async function findExistingCompanyWithSession(transaction, session) {
  if (transaction.companyCnpj) {
    return await findByCnpj(transaction.companyCnpj, session);
  }
  return null;
}

/**
 * Finds existing person in database by CPF with session
 * @param {Object} transaction - Transaction with person CPF data
 * @param {Object} session - MongoDB session
 * @returns {Object|null} Existing person or null
 */
async function findExistingPersonWithSession(transaction, session) {
  if (transaction.companyCnpj) {
    return await findByCpf(transaction.companyCnpj, session);
  }
  return null;
}

/**
 * Inserts a company with session support
 * @param {Object} companyData - Company data to insert
 * @param {Object} session - MongoDB session
 * @returns {Object} Created company
 */
async function insertCompanyWithSession(companyData, session) {
  return await insertCompany(companyData, session);
}

/**
 * Inserts a person with session support
 * @param {Object} personData - Person data to insert
 * @param {Object} session - MongoDB session
 * @returns {Object} Created person
 */
async function insertPersonWithSession(personData, session) {
  return await insertPerson(personData, session);
}

/**
 * Updates transaction with companyId using session and removes redundant company fields
 * @param {Object} transaction - Transaction to update
 * @param {string} companyId - Company ID to link
 * @param {Object} session - MongoDB session
 * @returns {boolean} True if updated, false if skipped
 */
async function updateTransactionWithCompanyIdSession(
  transaction,
  companyId,
  session
) {
  try {
    // Only update if companyId is not already set
    if (!transaction.companyId) {
      const updateData = {
        companyId,
        // Remove redundant company fields now that we have a reference
        $unset: {
          companyName: '',
          companySellerName: '',
          companyCnpj: '',
        },
      };

      await updateTransaction(transaction.id, updateData, session);
      console.log(
        `🔗 Updated transaction ${transaction.id} with companyId: ${companyId} and removed redundant company fields`
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      `❌ Error updating transaction ${transaction.id} with companyId:`,
      error.message
    );
    throw error; // Rethrow to trigger transaction rollback
  }
}

/**
 * Updates transaction with personId using session and removes redundant company fields
 * @param {Object} transaction - Transaction to update
 * @param {string} personId - Person ID to link
 * @param {Object} session - MongoDB session
 * @returns {boolean} True if updated, false if skipped
 */
async function updateTransactionWithPersonIdSession(
  transaction,
  personId,
  session
) {
  try {
    // Only update if personId is not already set (using companyId field for now)
    if (!transaction.companyId) {
      const updateData = {
        companyId: personId, // Using same field for simplicity
        // Remove redundant company fields now that we have a reference
        $unset: {
          companyName: '',
          companySellerName: '',
          companyCnpj: '',
        },
      };

      await updateTransaction(transaction.id, updateData, session);
      console.log(
        `🔗 Updated transaction ${transaction.id} with personId: ${personId} and removed redundant company fields`
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      `❌ Error updating transaction ${transaction.id} with personId:`,
      error.message
    );
    return false;
  }
}

/**
 * Creates a company object from transaction data with CNPJ
 * @param {Object} transaction - Transaction containing company CNPJ information
 * @returns {Object|null} Company data object or null if insufficient data
 */
function createCompanyFromTransaction(transaction) {
  // Require CNPJ since we're filtering for it
  if (!transaction.companyCnpj || transaction.companyCnpj.trim() === '') {
    return null;
  }

  const companyData = {
    // Core identification (razaoSocial / nomeFantasia)
    companyName: transaction.companyName || '', // From TransactionModel
    corporateName: transaction.companyName || '', // razaoSocial
    tradeName: transaction.companyName || '', // nomeFantasia
    companySellerName: transaction.companySellerName || '', // From TransactionModel

    // Tax identification (documento)
    companyCnpj: transaction.companyCnpj || '', // Keep for compatibility

    // Registration info (informacoes de registro)
    registrationInfo: {
      registrationNumber: '', // numeroRegistro
      registrationDate: null, // dataRegistro
      registrationStatus: 'active', // statusRegistro - assume active
      legalNature: '', // naturezaJuridica
      companySize: '', // porteEmpresa
      shareCapital: '', // capitalSocial
    },

    // Contact information (informacoes de contato)
    contacts: {
      mainEmail: '', // emailPrincipal
      secondaryEmail: '', // emailSecundario
      mainPhone: '', // telefonePrincipal
      secondaryPhone: '', // telefoneSecundario
      website: '', // website
      socialMedia: {
        facebook: '', // redesSociais.facebook
        instagram: '', // redesSociais.instagram
        linkedin: '', // redesSociais.linkedin
        twitter: '', // redesSociais.twitter
      },
    },

    // Address (endereco)
    address: {
      street: '', // endereco.rua
      number: '', // endereco.numero
      complement: '', // endereco.complemento
      neighborhood: '', // endereco.bairro
      city: '', // endereco.cidade
      state: '', // endereco.estado
      zipCode: '', // endereco.cep
      country: 'Brasil', // endereco.pais - default to Brazil
    },

    // Business activities (atividades)
    activities: {
      primaryActivity: '', // atividadePrincipal
      secondaryActivities: [], // atividadesSecundarias
      cnaeCode: '', // codigoCnae
      cnaeDescription: '', // descricaoCnae
    },

    // Corporate structure (estrutura societaria)
    corporateStructure: {
      partners: [], // socios
      administrators: transaction.companySellerName
        ? [
            {
              name: transaction.companySellerName, // nome
              document: '', // documento
              role: 'Seller', // cargo
              participationPercentage: '', // percentualParticipacao
            },
          ]
        : [], // administradores
      legalRepresentatives: [], // representantesLegais
    },

    // Financial information (informacoes financeiras)
    financialInfo: {
      annualRevenue: '', // faturamentoAnual
      employeeCount: '', // numeroFuncionarios
      creditRating: '', // rating
      taxRegime: '', // regimeTributario
    },

    // Additional information (informacoes adicionais)
    additionalInfo: {
      description: '', // descricao
      observations: `Migrated from transaction data. Original seller: ${
        transaction.companySellerName || 'N/A'
      }`, // observacoes
      tags: ['migrated-from-transaction'], // tags
      isActive: true, // ativo
      verificationStatus: 'pending', // statusVerificacao
    },

    // Metadata
    createdAt: new Date(),
    updatedAt: new Date(),
    dataSource: 'transaction-migration', // fonte de dados
  };

  return companyData;
}

/**
 * Creates person data from transaction
 * @param {Object} transaction - Transaction containing person data
 * @returns {Object|null} Person data object or null
 */
function createPersonFromTransaction(transaction) {
  if (!transaction.companyCnpj) {
    return null;
  }

  const personData = {
    fullName:
      transaction.companyName ||
      transaction.companySellerName ||
      'Nome não informado',
    cpf: formatCPF(transaction.companyCnpj),
    status: 'active',
    sourceTransaction: transaction._id,
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

export default migrateCompanyDataToCompanyCollection;

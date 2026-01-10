// filepath: /home/xxx/Desktop/VScode_projects/Personal-Finance-Helper/perfinper-api/src/services/migrationService/fixCompaniesEntities/index.js
import CompanyModel from '../../../models/CompanyModel.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../../../config/logger.js';

dotenv.config();

/**
 * Ensures an object has the required nested structure based on the schema
 * @param {Object} company - Company object to fix
 * @param {String} path - Path to check/create in the object
 * @param {any} defaultValue - Default value to set if the path doesn't exist
 */
function ensureNestedStructure(company, path, defaultValue = {}) {
  const parts = path.split('.');
  let current = company;

  // Build the nested structure, traversing through all parts except the last
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the last part if it doesn't exist
  const lastPart = parts[parts.length - 1];
  if (current[lastPart] === undefined) {
    current[lastPart] = defaultValue;
  }
}

/**
 * Fixes basic information and registration fields in company object
 * @param {Object} company - Original company object
 * @returns {Object} - Object with fixed basic and registration fields
 */
function fixCompanyBasicInfo(company) {
  return {
    // Basic company information (required fields)
    companyName: company.companyName || '',
    companyCnpj: company.companyCnpj || '',

    // Registration information (optional fields)
    corporateName: company.corporateName || company.companyName || '',
    tradeName: company.tradeName || company.companyName || '',
    foundationDate: company.foundationDate || null,
    companySize: company.companySize || '',
    legalNature: company.legalNature || '',
    microEntrepreneurOption:
      company.microEntrepreneurOption !== undefined
        ? company.microEntrepreneurOption
        : false,
    simplifiedTaxOption:
      company.simplifiedTaxOption !== undefined
        ? company.simplifiedTaxOption
        : false,
    shareCapital: company.shareCapital || '',
    companyType: company.companyType || null,
    status: company.status || 'Ativa',
    statusDate: company.statusDate || null,
  };
}

/**
 * Fixes the structure of a company object according to the schema
 * @param {Object} company - Company object to fix
 * @returns {Object} - Fixed company object
 */
function fixCompanyStructure(company) {
  try {
    // Create a clean object with the required fields
    const fixedCompany = fixCompanyBasicInfo(company);

    try {
      // Contact information
      fixedCompany.contacts = {
        email: company.contacts?.email || '',
        phones: Array.isArray(company.contacts?.phones)
          ? company.contacts.phones
          : [],
        website: company.contacts?.website || '',
        socialMedia: Array.isArray(company.contacts?.socialMedia)
          ? company.contacts.socialMedia
          : [],
      };
    } catch (error) {
      logger.warn(
        `Error fixing contacts for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.contacts = {
        email: '',
        phones: [],
        website: '',
        socialMedia: [],
      };
    }

    try {
      // Ensure socialMedia items have the correct structure
      if (fixedCompany.contacts.socialMedia.length > 0) {
        fixedCompany.contacts.socialMedia =
          fixedCompany.contacts.socialMedia.map((item) => ({
            platform: item?.platform || 'Other',
            handle: item?.handle || '',
            url: item?.url || '',
            isActive: item?.isActive !== undefined ? item.isActive : true,
          }));
      }
    } catch (error) {
      logger.warn(
        `Error fixing social media for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.contacts.socialMedia = [];
    }

    try {
      // Address information
      fixedCompany.address = {
        street: company.address?.street || '',
        number: company.address?.number || '',
        complement: company.address?.complement || '',
        neighborhood: company.address?.neighborhood || '',
        zipCode: company.address?.zipCode || '',
        city: company.address?.city || '',
        state: company.address?.state || '',
        country: company.address?.country || 'Brasil',
      };
    } catch (error) {
      logger.warn(
        `Error fixing address for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.address = {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        zipCode: '',
        city: '',
        state: '',
        country: 'Brasil',
      };
    }

    try {
      // Business activities (CNAE)
      fixedCompany.activities = {
        primary: {
          code: company.activities?.primary?.code || '',
          description: company.activities?.primary?.description || '',
        },
        secondary: Array.isArray(company.activities?.secondary)
          ? company.activities.secondary.map((item) => ({
              code: item?.code || '',
              description: item?.description || '',
            }))
          : [],
      };
    } catch (error) {
      logger.warn(
        `Error fixing activities for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.activities = {
        primary: { code: '', description: '' },
        secondary: [],
      };
    }

    try {
      // Corporate structure
      fixedCompany.corporateStructure = Array.isArray(
        company.corporateStructure
      )
        ? company.corporateStructure.map((item) => ({
            name: item?.name || '',
            type: item?.type || 'Sócio',
            cnpj: item?.cnpj || '',
            country: item?.country || 'Brasil',
          }))
        : [];
    } catch (error) {
      logger.warn(
        `Error fixing corporate structure for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.corporateStructure = [];
    }

    try {
      // Add companySeller as a "Vendedor" in the corporate structure if it exists
      if (company.companySeller) {
        fixedCompany.corporateStructure.push({
          name: company.companySeller,
          type: 'Vendedor',
          cnpj: '',
          country: 'Brasil',
        });
      }
    } catch (error) {
      logger.warn(
        `Error adding company seller for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
    }

    try {
      // Preserve the ID if it exists
      if (company._id) {
        fixedCompany._id = company._id;
      }
    } catch (error) {
      logger.warn(
        `Error preserving ID for company ${company.companyName || 'unknown'}: ${
          error.message
        }`
      );
    }

    try {
      // Preserve timestamps
      fixedCompany.createdAt = company.createdAt || new Date();
      fixedCompany.updatedAt = new Date();
    } catch (error) {
      logger.warn(
        `Error setting timestamps for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.createdAt = new Date();
      fixedCompany.updatedAt = new Date();
    }

    try {
      // Statistics
      fixedCompany.statistics = {
        totalTransactions: company.statistics?.totalTransactions || 0,
        totalTransactionValue: company.statistics?.totalTransactionValue || '0',
        lastTransaction: company.statistics?.lastTransaction || null,
      };
    } catch (error) {
      logger.warn(
        `Error fixing statistics for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
      fixedCompany.statistics = {
        totalTransactions: 0,
        totalTransactionValue: '0',
        lastTransaction: null,
      };
    }

    try {
      // Source transaction
      if (company.sourceTransaction) {
        fixedCompany.sourceTransaction = company.sourceTransaction;
      }
    } catch (error) {
      logger.warn(
        `Error setting source transaction for company ${
          company.companyName || 'unknown'
        }: ${error.message}`
      );
    }

    return fixedCompany;
  } catch (error) {
    logger.error(
      `Failed to fix company structure for ${
        company?.companyName || 'unknown company'
      }: ${error.message}`
    );
    // Return a minimal valid company object as fallback
    return {
      companyName: company?.companyName || 'Error - Unknown Company',
      companyCnpj: company?.companyCnpj || '',
      contacts: { email: '', phones: [], website: '', socialMedia: [] },
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
      activities: { primary: { code: '', description: '' }, secondary: [] },
      corporateStructure: [],
      statistics: {
        totalTransactions: 0,
        totalTransactionValue: '0',
        lastTransaction: null,
      },
      createdAt: company?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Process individual company and update in database
 * @param {Object} company - Company document from MongoDB
 * @param {Object} session - MongoDB session
 * @param {boolean} dryRun - If true, don't actually update
 * @returns {Object} - Result with status and error if any
 */
/**
 * Log the processing of a company
 * @param {Object} company - Company document
 * @param {boolean} dryRun - If true, log as dry run
 */
function logCompanyProcessing(company, dryRun) {
  const action = dryRun ? 'Would fix' : 'Fixed';
  const message = `${action} company: ${company.companyName} (${company.companyCnpj})`;
  logger.info(message);
  console.log(message); // Also log to console for immediate visibility
}

/**
 * Process individual company and update in database
 * @param {Object} company - Company document from MongoDB
 * @param {Object} session - MongoDB session
 * @param {boolean} dryRun - If true, don't actually update
 * @returns {Promise<Object>} - Result with status and error if any
 */
async function processCompany(company, session, dryRun) {
  try {
    const originalCompany = JSON.parse(JSON.stringify(company.toObject()));
    const fixedCompany = fixCompanyStructure(originalCompany);

    // Log the operation
    logCompanyProcessing(company, dryRun);

    // In a dry run, don't update the database
    if (!dryRun) {
      await CompanyModel.findByIdAndUpdate(company._id, fixedCompany, {
        session,
      });
    }

    return { success: true };
  } catch (error) {
    const errorMessage = `Error fixing company ${company.companyName} (${company.companyCnpj}): ${error.message}`;
    logger.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Connect to MongoDB if not already connected
 * @returns {Promise<void>}
 */
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const connectionStartTime = Date.now();
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_CONNECTION);
    logger.info(`MongoDB connected in ${Date.now() - connectionStartTime}ms`);
  }
}

/**
 * Process all companies and update them according to schema
 * @param {Array} companies - Array of company documents
 * @param {Object} session - MongoDB session
 * @param {boolean} dryRun - If true, don't actually update
 * @returns {Promise<Object>} - Statistics about the processing
 */
async function processAllCompanies(companies, session, dryRun) {
  const stats = {
    total: companies.length,
    fixed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  };

  // Process each company
  for (const company of companies) {
    const result = await processCompany(company, session, dryRun);
    if (result.success) {
      stats.fixed++;
    } else {
      stats.failed++;
      if (result.error) {
        stats.errors.push(result.error);
      }
    }
  }

  return Promise.resolve(stats);
}

/**
 * Log the results of the fix operation
 * @param {Object} stats - Statistics object
 */
function logResults(stats) {
  const successRate =
    stats.total > 0 ? ((stats.fixed / stats.total) * 100).toFixed(2) : '0.00';

  const summaryMsg = `Company fix operation completed: ${stats.fixed}/${stats.total} companies fixed (${successRate}%)`;
  logger.info(summaryMsg);
  console.log(summaryMsg);

  const detailMsg = `Failed: ${stats.failed}, Warnings: ${stats.warnings}`;
  logger.info(detailMsg);
  console.log(detailMsg);

  if (stats.errors.length > 0) {
    const errorMsg = `Errors encountered: ${stats.errors.length}`;
    logger.info(errorMsg);
    console.log(errorMsg);

    // Output the first few errors to console for visibility
    if (stats.errors.length > 0) {
      console.log('First few errors:');
      stats.errors
        .slice(0, 3)
        .forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      if (stats.errors.length > 3) {
        console.log(`  ... and ${stats.errors.length - 3} more errors`);
      }
    }
  }
}

/**
 * Fixes all company entities in the database
 * @param {boolean} dryRun - If true, shows what would be changed without making actual updates
 * @returns {Promise<Object>} - Result statistics
 */
export async function fixCompaniesEntities(dryRun = true) {
  let session = null;

  try {
    await ensureDbConnection();

    // Start session and transaction if not a dry run
    if (!dryRun) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    console.log('Starting company entities fix operation...');
    logger.info('Starting company entities fix operation...');
    logger.info(
      `Mode: ${
        dryRun
          ? 'Dry Run (no changes will be made)'
          : 'Live Run (changes will be applied)'
      }`
    );
    console.log(`Mode: ${dryRun ? 'Dry Run' : 'Live Run'}`);

    // Fetch all companies
    const companies = await CompanyModel.find();
    console.log(`Found ${companies.length} companies to process`);
    logger.info(`Found ${companies.length} companies to process`);

    // Process all companies
    const stats = await processAllCompanies(companies, session, dryRun);

    // Commit transaction if not a dry run
    if (!dryRun && session) {
      await session.commitTransaction();
      logger.info('Transaction committed successfully');
    }

    // Log results
    logResults(stats);

    return stats;
  } catch (error) {
    // Abort transaction on error if not a dry run
    if (!dryRun && session) {
      await session.abortTransaction();
      logger.error('Transaction aborted due to error');
    }

    logger.error(`Error fixing company entities: ${error.message}`);
    throw error;
  } finally {
    // End session if it exists
    if (session) {
      await session.endSession();
    }
  }
}

export {
  ensureNestedStructure,
  fixCompanyBasicInfo,
  fixCompanyStructure,
  logCompanyProcessing,
  processCompany,
  processAllCompanies,
  logResults,
};

// // This allows the script to be run directly from the command line
// if (process.argv[1].endsWith('index.js')) {
//   const dryRun = process.argv.includes('--dry-run');

//   fixCompaniesEntities(dryRun)
//     .then((stats) => {
//       console.log('Company fix operation completed with the following stats:');
//       console.log(JSON.stringify(stats, null, 2));
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('Failed to fix company entities:', error);
//       process.exit(1);
//     });
// }

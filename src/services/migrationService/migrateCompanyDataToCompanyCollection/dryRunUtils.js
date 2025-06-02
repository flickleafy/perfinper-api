/**
 * Dry-run utilities for migration service
 * Provides statistics collection and display functionality for dry-run mode
 */

/**
 * Creates an initial dry-run statistics object
 * @returns {Object} Empty dry-run statistics structure
 */
export function createDryRunStats() {
  return {
    isDryRun: true,
    transactionsAnalyzed: 0,
    cnpjRecords: [],
    cpfRecords: [],
    anonymousCpfRecords: [],
    failedRecords: [],
    existingEntities: [],
    companiesWouldCreate: 0,
    personsWouldCreate: 0,
    anonymousPersonsWouldCreate: 0,
    companiesExisting: 0,
    personsExisting: 0,
    transactionsWouldUpdate: 0,
    uniqueEntitiesProcessed: 0,
  };
}

/**
 * Adds a CNPJ record to dry-run statistics
 * @param {Object} stats - Dry-run statistics object
 * @param {string} identifier - CNPJ identifier
 * @param {Object} data - Company data that would be created
 * @param {Object} transaction - Source transaction
 */
export function addCnpjRecord(stats, identifier, data, transaction) {
  stats.cnpjRecords.push({
    identifier,
    name: data.corporateName || data.tradeName || 'Unnamed Company',
    type: 'company',
    data,
    source: `Transaction ID: ${transaction._id || transaction.id || 'Unknown'}`,
  });
  stats.companiesWouldCreate++;
}

/**
 * Adds a CPF record to dry-run statistics
 * @param {Object} stats - Dry-run statistics object
 * @param {string} identifier - CPF identifier
 * @param {Object} data - Person data that would be created
 * @param {Object} transaction - Source transaction
 */
export function addCpfRecord(stats, identifier, data, transaction) {
  stats.cpfRecords.push({
    identifier,
    name: data.fullName || 'Unnamed Person',
    type: 'person',
    data,
    source: `Transaction ID: ${transaction._id || transaction.id || 'Unknown'}`,
  });
  stats.personsWouldCreate++;
}

/**
 * Adds an anonymous CPF record to dry-run statistics
 * @param {Object} stats - Dry-run statistics object
 * @param {string} identifier - Anonymized CPF identifier
 * @param {Object} data - Anonymous person data that would be created
 * @param {Object} transaction - Source transaction
 */
export function addAnonymousCpfRecord(stats, identifier, data, transaction) {
  stats.anonymousCpfRecords.push({
    identifier,
    name: data.fullName || 'Anonymous Person',
    type: 'anonymous',
    data,
    source: `Transaction ID: ${transaction._id || transaction.id || 'Unknown'}`,
  });
  stats.anonymousPersonsWouldCreate++;
}

/**
 * Adds an existing entity record to dry-run statistics
 * @param {Object} stats - Dry-run statistics object
 * @param {string} identifier - Entity identifier
 * @param {Object} existingEntity - Existing entity data
 * @param {string} type - Entity type (company/person)
 */
export function addExistingEntity(stats, identifier, existingEntity, type) {
  stats.existingEntities.push({
    identifier,
    name:
      existingEntity.corporateName ||
      existingEntity.tradeName ||
      existingEntity.fullName ||
      'Unnamed Entity',
    type,
    id: existingEntity.id || existingEntity._id,
  });

  if (type === 'company') {
    stats.companiesExisting++;
  } else if (type === 'person') {
    stats.personsExisting++;
  }
}

/**
 * Adds a failed record to dry-run statistics
 * @param {Object} stats - Dry-run statistics object
 * @param {Object} transaction - Failed transaction
 * @param {string} error - Error message
 */
export function addFailedRecord(stats, transaction, error) {
  stats.failedRecords.push({
    identifier: transaction.companyCnpj || 'Unknown',
    transaction: {
      id: transaction._id || transaction.id || 'Unknown',
      companyCnpj: transaction.companyCnpj,
      companyName: transaction.companyName,
      description: transaction.description,
    },
    error,
  });
}

/**
 * Increments transaction update counter
 * @param {Object} stats - Dry-run statistics object
 */
export function incrementTransactionUpdates(stats) {
  stats.transactionsWouldUpdate++;
}

/**
 * Displays comprehensive dry-run statistics
 * @param {Object} stats - Dry-run statistics object
 */
export function displayDryRunStatistics(stats) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 DRY RUN MIGRATION ANALYSIS COMPLETE');
  console.log('='.repeat(80));

  console.log(`\n📊 OVERVIEW:`);
  console.log(`   • Transactions Analyzed: ${stats.transactionsAnalyzed}`);
  console.log(
    `   • Unique Entities Processed: ${stats.uniqueEntitiesProcessed}`
  );
  console.log(
    `   • Transactions That Would Update: ${stats.transactionsWouldUpdate}`
  );

  // Companies section
  console.log(`\n🏢 COMPANIES (CNPJ):`);
  console.log(`   • Would Create: ${stats.companiesWouldCreate}`);
  console.log(`   • Already Exist: ${stats.companiesExisting}`);

  if (stats.cnpjRecords.length > 0) {
    console.log(`\n   📋 Companies that would be created:`);
    stats.cnpjRecords.slice(0, 10).forEach((record, index) => {
      console.log(`      ${index + 1}. ${record.identifier} - ${record.name}`);
    });
    if (stats.cnpjRecords.length > 10) {
      console.log(`      ... and ${stats.cnpjRecords.length - 10} more`);
    }
  }

  // Persons section
  console.log(`\n👤 PERSONS (CPF):`);
  console.log(`   • Would Create: ${stats.personsWouldCreate}`);
  console.log(`   • Already Exist: ${stats.personsExisting}`);

  if (stats.cpfRecords.length > 0) {
    console.log(`\n   📋 Persons that would be created:`);
    stats.cpfRecords.slice(0, 10).forEach((record, index) => {
      console.log(`      ${index + 1}. ${record.identifier} - ${record.name}`);
    });
    if (stats.cpfRecords.length > 10) {
      console.log(`      ... and ${stats.cpfRecords.length - 10} more`);
    }
  }

  // Anonymous persons section
  console.log(`\n🕶️  ANONYMOUS PERSONS (Anonymized CPF):`);
  console.log(`   • Would Create: ${stats.anonymousPersonsWouldCreate}`);

  if (stats.anonymousCpfRecords.length > 0) {
    console.log(`\n   📋 Anonymous persons that would be created:`);
    stats.anonymousCpfRecords.slice(0, 10).forEach((record, index) => {
      console.log(`      ${index + 1}. ${record.identifier} - ${record.name}`);
    });
    if (stats.anonymousCpfRecords.length > 10) {
      console.log(
        `      ... and ${stats.anonymousCpfRecords.length - 10} more`
      );
    }
  }

  // Existing entities section
  if (stats.existingEntities.length > 0) {
    console.log(`\n✅ EXISTING ENTITIES (Would Skip):`);
    console.log(`   • Total: ${stats.existingEntities.length}`);
    console.log(`\n   📋 Sample existing entities:`);
    stats.existingEntities.slice(0, 5).forEach((entity, index) => {
      console.log(
        `      ${index + 1}. ${entity.identifier} - ${entity.name} (${
          entity.type
        })`
      );
    });
    if (stats.existingEntities.length > 5) {
      console.log(`      ... and ${stats.existingEntities.length - 5} more`);
    }
  }

  // Failed records section
  if (stats.failedRecords.length > 0) {
    console.log(`\n❌ FAILED RECORDS:`);
    console.log(`   • Total Failed: ${stats.failedRecords.length}`);
    console.log(`\n   📋 Failed transactions:`);
    stats.failedRecords.forEach((failed, index) => {
      console.log(`      ${index + 1}. ${failed.identifier} - ${failed.error}`);
      console.log(
        `         Company: ${failed.transaction.companyName || 'N/A'}`
      );
    });
  }

  // Summary
  const totalWouldCreate =
    stats.companiesWouldCreate +
    stats.personsWouldCreate +
    stats.anonymousPersonsWouldCreate;
  const totalExisting = stats.companiesExisting + stats.personsExisting;

  console.log(`\n📈 SUMMARY:`);
  console.log(`   • Total Records That Would Be Created: ${totalWouldCreate}`);
  console.log(`   • Total Existing Records (Would Skip): ${totalExisting}`);
  console.log(`   • Total Failed Records: ${stats.failedRecords.length}`);
  console.log(
    `   • Success Rate: ${(
      ((totalWouldCreate + totalExisting) /
        (totalWouldCreate + totalExisting + stats.failedRecords.length)) *
      100
    ).toFixed(1)}%`
  );

  console.log('\n' + '='.repeat(80));
  console.log(
    '✨ This was a DRY RUN - No actual changes were made to the database'
  );
  console.log('='.repeat(80) + '\n');
}

/**
 * Generates a detailed JSON report of dry-run results
 * @param {Object} stats - Dry-run statistics object
 * @returns {Object} Detailed JSON report
 */
export function generateDryRunReport(stats) {
  return {
    summary: {
      isDryRun: stats.isDryRun,
      transactionsAnalyzed: stats.transactionsAnalyzed,
      uniqueEntitiesProcessed: stats.uniqueEntitiesProcessed,
      transactionsWouldUpdate: stats.transactionsWouldUpdate,
      totalWouldCreate:
        stats.companiesWouldCreate +
        stats.personsWouldCreate +
        stats.anonymousPersonsWouldCreate,
      totalExisting: stats.companiesExisting + stats.personsExisting,
      totalFailed: stats.failedRecords.length,
    },
    details: {
      companies: {
        wouldCreate: stats.companiesWouldCreate,
        existing: stats.companiesExisting,
        records: stats.cnpjRecords,
      },
      persons: {
        wouldCreate: stats.personsWouldCreate,
        existing: stats.personsExisting,
        records: stats.cpfRecords,
      },
      anonymousPersons: {
        wouldCreate: stats.anonymousPersonsWouldCreate,
        records: stats.anonymousCpfRecords,
      },
      existingEntities: stats.existingEntities,
      failedRecords: stats.failedRecords,
    },
    timestamp: new Date().toISOString(),
  };
}

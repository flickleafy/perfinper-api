/**
 * Unit tests for DryRunUtils
 * Tests all dry-run utility functions and statistics collection
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import {
  createDryRunStats,
  addCnpjRecord,
  addCpfRecord,
  addAnonymousCpfRecord,
  addExistingEntity,
  addFailedRecord,
  incrementTransactionUpdates,
  displayDryRunStatistics,
  generateDryRunReport,
} from './dryRunUtils.js';

// Mock console methods
const originalConsole = console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
  };
});

describe('DryRunUtils', () => {
  describe('createDryRunStats', () => {
    test('should create initial dry-run statistics object', () => {
      const stats = createDryRunStats();

      expect(stats).toEqual({
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
      });
    });
  });

  describe('addCnpjRecord', () => {
    test('should add CNPJ record with corporate name', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const data = {
        cnpj: identifier,
        corporateName: 'Test Company Inc.',
        tradeName: 'Test Company',
      };
      const transaction = { _id: 'trans123' };

      addCnpjRecord(stats, identifier, data, transaction);

      expect(stats.cnpjRecords).toHaveLength(1);
      expect(stats.cnpjRecords[0]).toEqual({
        identifier,
        name: 'Test Company Inc.',
        type: 'company',
        data,
        source: 'Transaction ID: trans123',
      });
      expect(stats.companiesWouldCreate).toBe(1);
    });

    test('should add CNPJ record with trade name when no corporate name', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const data = {
        cnpj: identifier,
        tradeName: 'Test Company',
      };
      const transaction = { _id: 'trans123' };

      addCnpjRecord(stats, identifier, data, transaction);

      expect(stats.cnpjRecords[0].name).toBe('Test Company');
    });

    test('should handle unnamed company', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const data = { cnpj: identifier };
      const transaction = { _id: 'trans123' };

      addCnpjRecord(stats, identifier, data, transaction);

      expect(stats.cnpjRecords[0].name).toBe('Unnamed Company');
    });

    test('should use transaction id when _id is missing', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const data = { cnpj: identifier, corporateName: 'Company' };
      const transaction = { id: 'trans-id' };

      addCnpjRecord(stats, identifier, data, transaction);

      expect(stats.cnpjRecords[0].source).toBe('Transaction ID: trans-id');
    });
  });

  describe('addCpfRecord', () => {
    test('should add CPF record correctly', () => {
      const stats = createDryRunStats();
      const identifier = '123.456.789-01';
      const data = {
        cpf: identifier,
        fullName: 'João Silva',
      };
      const transaction = { _id: 'trans456' };

      addCpfRecord(stats, identifier, data, transaction);

      expect(stats.cpfRecords).toHaveLength(1);
      expect(stats.cpfRecords[0]).toEqual({
        identifier,
        name: 'João Silva',
        type: 'person',
        data,
        source: 'Transaction ID: trans456',
      });
      expect(stats.personsWouldCreate).toBe(1);
    });

    test('should handle unnamed person', () => {
      const stats = createDryRunStats();
      const identifier = '123.456.789-01';
      const data = { cpf: identifier };
      const transaction = { _id: 'trans456' };

      addCpfRecord(stats, identifier, data, transaction);

      expect(stats.cpfRecords[0].name).toBe('Unnamed Person');
    });

    test('should use unknown source when transaction has no id', () => {
      const stats = createDryRunStats();
      const identifier = '123.456.789-01';
      const data = { fullName: 'No Id' };
      const transaction = {};

      addCpfRecord(stats, identifier, data, transaction);

      expect(stats.cpfRecords[0].source).toBe('Transaction ID: Unknown');
    });
  });

  describe('addAnonymousCpfRecord', () => {
    test('should add anonymous CPF record correctly', () => {
      const stats = createDryRunStats();
      const identifier = '***456.789-**';
      const data = {
        cpf: identifier,
        fullName: 'Anonymous Person',
        isAnonymous: true,
      };
      const transaction = { _id: 'trans789' };

      addAnonymousCpfRecord(stats, identifier, data, transaction);

      expect(stats.anonymousCpfRecords).toHaveLength(1);
      expect(stats.anonymousCpfRecords[0]).toEqual({
        identifier,
        name: 'Anonymous Person',
        type: 'anonymous',
        data,
        source: 'Transaction ID: trans789',
      });
      expect(stats.anonymousPersonsWouldCreate).toBe(1);
    });

    test('should use transaction id when _id is missing', () => {
      const stats = createDryRunStats();
      const identifier = '***456.789-**';
      const data = { fullName: 'Anon' };
      const transaction = { id: 'trans-anon' };

      addAnonymousCpfRecord(stats, identifier, data, transaction);

      expect(stats.anonymousCpfRecords[0].source).toBe(
        'Transaction ID: trans-anon'
      );
    });
  });

  describe('addExistingEntity', () => {
    test('should add existing company entity', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const existingEntity = {
        id: 'company123',
        corporateName: 'Existing Company',
      };

      addExistingEntity(stats, identifier, existingEntity, 'company');

      expect(stats.existingEntities).toHaveLength(1);
      expect(stats.existingEntities[0]).toEqual({
        identifier,
        name: 'Existing Company',
        type: 'company',
        id: 'company123',
      });
      expect(stats.companiesExisting).toBe(1);
    });

    test('should add existing person entity', () => {
      const stats = createDryRunStats();
      const identifier = '123.456.789-01';
      const existingEntity = {
        id: 'person123',
        fullName: 'Existing Person',
      };

      addExistingEntity(stats, identifier, existingEntity, 'person');

      expect(stats.existingEntities).toHaveLength(1);
      expect(stats.existingEntities[0]).toEqual({
        identifier,
        name: 'Existing Person',
        type: 'person',
        id: 'person123',
      });
      expect(stats.personsExisting).toBe(1);
    });

    test('should handle entity with trade name', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const existingEntity = {
        id: 'company123',
        tradeName: 'Trade Name Company',
      };

      addExistingEntity(stats, identifier, existingEntity, 'company');

      expect(stats.existingEntities[0].name).toBe('Trade Name Company');
    });

    test('should handle unnamed existing entity', () => {
      const stats = createDryRunStats();
      const identifier = '12.345.678/0001-95';
      const existingEntity = {
        id: 'company999',
      };

      addExistingEntity(stats, identifier, existingEntity, 'company');

      expect(stats.existingEntities[0].name).toBe('Unnamed Entity');
    });
  });

  describe('addFailedRecord', () => {
    test('should add failed record correctly', () => {
      const stats = createDryRunStats();
      const transaction = {
        _id: 'trans999',
        companyCnpj: '99.999.999/0001-99',
        companyName: 'Failed Company',
        description: 'Failed transaction',
      };
      const error = 'Database connection failed';

      addFailedRecord(stats, transaction, error);

      expect(stats.failedRecords).toHaveLength(1);
      expect(stats.failedRecords[0]).toEqual({
        identifier: '99.999.999/0001-99',
        transaction: {
          id: 'trans999',
          companyCnpj: '99.999.999/0001-99',
          companyName: 'Failed Company',
          description: 'Failed transaction',
        },
        error,
      });
    });

    test('should handle transaction without companyCnpj', () => {
      const stats = createDryRunStats();
      const transaction = {
        _id: 'trans999',
        companyName: 'Failed Company',
      };
      const error = 'Invalid data';

      addFailedRecord(stats, transaction, error);

      expect(stats.failedRecords[0].identifier).toBe('Unknown');
    });

    test('should use unknown id when transaction has no id', () => {
      const stats = createDryRunStats();
      const transaction = {
        companyCnpj: '99.999.999/0001-99',
      };
      const error = 'Invalid data';

      addFailedRecord(stats, transaction, error);

      expect(stats.failedRecords[0].transaction.id).toBe('Unknown');
    });
  });

  describe('incrementTransactionUpdates', () => {
    test('should increment transaction updates counter', () => {
      const stats = createDryRunStats();

      incrementTransactionUpdates(stats);
      incrementTransactionUpdates(stats);

      expect(stats.transactionsWouldUpdate).toBe(2);
    });
  });

  describe('displayDryRunStatistics', () => {
    test('should display comprehensive statistics', () => {
      const stats = createDryRunStats();
      stats.transactionsAnalyzed = 100;
      stats.uniqueEntitiesProcessed = 75;
      stats.transactionsWouldUpdate = 50;

      // Add some sample data
      addCnpjRecord(
        stats,
        '12.345.678/0001-95',
        { corporateName: 'Company 1' },
        { _id: 'trans1' }
      );
      addCpfRecord(
        stats,
        '123.456.789-01',
        { fullName: 'Person 1' },
        { _id: 'trans2' }
      );
      addAnonymousCpfRecord(
        stats,
        '***456.789-**',
        { fullName: 'Anonymous 1' },
        { _id: 'trans3' }
      );
      addExistingEntity(
        stats,
        '11.111.111/0001-11',
        { corporateName: 'Existing Co' },
        'company'
      );
      addFailedRecord(
        stats,
        { _id: 'trans4', companyCnpj: '99.999.999/0001-99' },
        'Error'
      );

      displayDryRunStatistics(stats);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('DRY RUN MIGRATION ANALYSIS COMPLETE')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Transactions Analyzed: 100')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Would Create: 1')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Already Exist: 1')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No actual changes were made')
      );
    });

    test('should display overflow counts for long lists', () => {
      const stats = createDryRunStats();

      for (let i = 0; i < 12; i++) {
        addCnpjRecord(
          stats,
          `11.111.111/000${i}-11`,
          { corporateName: `Company ${i}` },
          { _id: `trans-cnpj-${i}` }
        );
        addCpfRecord(
          stats,
          `123.456.789-0${i}`,
          { fullName: `Person ${i}` },
          { _id: `trans-cpf-${i}` }
        );
        addAnonymousCpfRecord(
          stats,
          `***.***.***-${i}${i}`,
          { fullName: `Anonymous ${i}` },
          { _id: `trans-anon-${i}` }
        );
      }

      for (let i = 0; i < 7; i++) {
        addExistingEntity(
          stats,
          `22.222.222/000${i}-22`,
          { corporateName: `Existing ${i}` },
          'company'
        );
      }

      displayDryRunStatistics(stats);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('... and 2 more')
      );
    });
  });

  describe('generateDryRunReport', () => {
    test('should generate detailed JSON report', () => {
      const stats = createDryRunStats();
      stats.transactionsAnalyzed = 100;
      stats.uniqueEntitiesProcessed = 75;
      stats.transactionsWouldUpdate = 50;

      // Add sample data
      addCnpjRecord(
        stats,
        '12.345.678/0001-95',
        { corporateName: 'Company 1' },
        { _id: 'trans1' }
      );
      addCpfRecord(
        stats,
        '123.456.789-01',
        { fullName: 'Person 1' },
        { _id: 'trans2' }
      );

      const report = generateDryRunReport(stats);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');
      expect(report).toHaveProperty('timestamp');

      expect(report.summary).toEqual({
        isDryRun: true,
        transactionsAnalyzed: 100,
        uniqueEntitiesProcessed: 75,
        transactionsWouldUpdate: 50,
        totalWouldCreate: 2,
        totalExisting: 0,
        totalFailed: 0,
      });

      expect(report.details).toHaveProperty('companies');
      expect(report.details).toHaveProperty('persons');
      expect(report.details).toHaveProperty('anonymousPersons');
      expect(report.details).toHaveProperty('existingEntities');
      expect(report.details).toHaveProperty('failedRecords');

      expect(report.details.companies.wouldCreate).toBe(1);
      expect(report.details.persons.wouldCreate).toBe(1);
    });
  });
});

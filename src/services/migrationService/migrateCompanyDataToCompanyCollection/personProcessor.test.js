/**
 * Unit tests for PersonProcessor
 * Tests all person processing operations
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { EMPTY_RESULT } from './types.js';

// Mock dependencies
jest.unstable_mockModule('../../../repository/personRepository.js', () => ({
  findByCpf: jest.fn(),
  insert: jest.fn(),
}));

jest.unstable_mockModule('./entityAdapters.js', () => ({
  PersonAdapter: {
    fromTransaction: jest.fn(),
  },
}));

jest.unstable_mockModule('./transactionUpdater.js', () => ({
  TransactionUpdater: {
    updateWithPersonId: jest.fn(),
  },
}));

jest.unstable_mockModule('./dryRunUtils.js', () => ({
  addExistingEntity: jest.fn(),
  incrementTransactionUpdates: jest.fn(),
  addCpfRecord: jest.fn(),
  addFailedRecord: jest.fn(),
}));

const { findByCpf, insert: insertPerson } = await import(
  '../../../repository/personRepository.js'
);
const { PersonAdapter } = await import('./entityAdapters.js');
const { TransactionUpdater } = await import('./transactionUpdater.js');
const {
  addExistingEntity,
  incrementTransactionUpdates,
  addCpfRecord,
  addFailedRecord,
} = await import('./dryRunUtils.js');
const { PersonProcessor } = await import('./personProcessor.js');

// Mock console methods
const originalConsole = console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
  };
});

describe('PersonProcessor', () => {
  const mockSession = { id: 'session123' };
  let processedEntities;

  beforeEach(() => {
    jest.clearAllMocks();
    processedEntities = new Map();
  });

  afterAll(() => {
    global.console = originalConsole;
  });

  describe('process', () => {
    test('should handle existing person and update transaction', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '123.456.789-01',
        companyName: 'John Doe',
      };

      const existingPerson = {
        id: 'person123',
        fullName: 'John Doe',
        cpf: '123.456.789-01',
      };

      findByCpf.mockResolvedValue(existingPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValue(true);

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith('123.456.789-01', mockSession);
      expect(TransactionUpdater.updateWithPersonId).toHaveBeenCalledWith(
        transaction,
        'person123',
        mockSession
      );
      expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get('123.456.789-01')).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '✅ Person already exists: John Doe'
      );
    });

    test('should handle existing person when transaction update fails', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '123.456.789-01',
        companyName: 'John Doe',
      };

      const existingPerson = {
        id: 'person123',
        fullName: 'John Doe',
        cpf: '123.456.789-01',
      };

      findByCpf.mockResolvedValue(existingPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValue(false); // Update skipped

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual({ created: 0, skipped: 1, updated: 0 });
      expect(processedEntities.get('123.456.789-01')).toBe(true);
    });

    test('should track existing person in dry run', async () => {
      const transaction = {
        id: 'transaction-dry-existing',
        companyCnpj: '555.666.777-88',
        companyName: 'Dry Existing Person',
      };

      const existingPerson = {
        id: 'person-dry-existing',
        fullName: 'Dry Existing Person',
        cpf: '555.666.777-88',
      };

      const dryRunStats = { id: 'stats-existing' };

      findByCpf.mockResolvedValue(existingPerson);

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession,
        true,
        dryRunStats
      );

      expect(addExistingEntity).toHaveBeenCalledWith(
        dryRunStats,
        '555.666.777-88',
        existingPerson,
        'person'
      );
      expect(incrementTransactionUpdates).toHaveBeenCalledWith(dryRunStats);
      expect(TransactionUpdater.updateWithPersonId).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get('555.666.777-88')).toBe(true);
    });

    test('should create new person when none exists', async () => {
      const transaction = {
        id: 'transaction456',
        companyCnpj: '987.654.321-09',
        companyName: 'Jane Smith',
      };

      const newPersonData = {
        fullName: 'Jane Smith',
        cpf: '987.654.321-09',
        status: 'active',
      };

      const createdPerson = {
        id: 'person456',
        ...newPersonData,
      };

      findByCpf.mockResolvedValue(null);
      PersonAdapter.fromTransaction.mockReturnValue(newPersonData);
      insertPerson.mockResolvedValue(createdPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValue(true);

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith('987.654.321-09', mockSession);
      expect(PersonAdapter.fromTransaction).toHaveBeenCalledWith(transaction);
      expect(insertPerson).toHaveBeenCalledWith(newPersonData, mockSession);
      expect(TransactionUpdater.updateWithPersonId).toHaveBeenCalledWith(
        transaction,
        'person456',
        mockSession
      );
      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('987.654.321-09')).toBe(true);
      expect(console.log).toHaveBeenCalledWith('🆕 Created person: Jane Smith');
    });

    test('should collect dry run stats when creating new person', async () => {
      const transaction = {
        id: 'transaction-dry-new',
        companyCnpj: '444.333.222-11',
        companyName: 'Dry New Person',
      };

      const newPersonData = {
        fullName: 'Dry New Person',
        cpf: '444.333.222-11',
        status: 'active',
      };

      const dryRunStats = { id: 'stats-new' };

      findByCpf.mockResolvedValue(null);
      PersonAdapter.fromTransaction.mockReturnValue(newPersonData);

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession,
        true,
        dryRunStats
      );

      expect(addCpfRecord).toHaveBeenCalledWith(
        dryRunStats,
        '444.333.222-11',
        newPersonData,
        transaction
      );
      expect(incrementTransactionUpdates).toHaveBeenCalledWith(dryRunStats);
      expect(insertPerson).not.toHaveBeenCalled();
      expect(TransactionUpdater.updateWithPersonId).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('444.333.222-11')).toBe(true);
    });

    test('should handle case when PersonAdapter returns null', async () => {
      const transaction = {
        id: 'transaction789',
        companyCnpj: '111.111.111-11',
        companyName: 'Invalid Person',
      };

      findByCpf.mockResolvedValue(null);
      PersonAdapter.fromTransaction.mockReturnValue(null); // Invalid person data

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual(EMPTY_RESULT);
      expect(insertPerson).not.toHaveBeenCalled();
      expect(TransactionUpdater.updateWithPersonId).not.toHaveBeenCalled();
      expect(processedEntities.has('111.111.111-11')).toBe(false);
    });

    test('should handle errors during processing', async () => {
      const transaction = {
        id: 'transaction999',
        companyCnpj: '999.999.999-99',
        companyName: 'Error Person',
      };

      const error = new Error('Database connection failed');
      findByCpf.mockRejectedValue(error);

      await expect(
        PersonProcessor.process(transaction, processedEntities, mockSession)
      ).rejects.toThrow('Database connection failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error processing person transaction:',
        'Database connection failed'
      );
    });

    test('should track failed record in dry run', async () => {
      const transaction = {
        id: 'transaction-dry-error',
        companyCnpj: '000.000.000-00',
        companyName: 'Dry Error Person',
      };

      const dryRunStats = { id: 'stats-error' };
      findByCpf.mockRejectedValue(new Error('Dry run failure'));

      await expect(
        PersonProcessor.process(
          transaction,
          processedEntities,
          mockSession,
          true,
          dryRunStats
        )
      ).rejects.toThrow('Dry run failure');

      expect(addFailedRecord).toHaveBeenCalledWith(
        dryRunStats,
        transaction,
        'Dry run failure'
      );
    });

    test('should handle errors during person creation', async () => {
      const transaction = {
        id: 'transaction888',
        companyCnpj: '888.888.888-88',
        companyName: 'Error Person',
      };

      const newPersonData = {
        fullName: 'Error Person',
        cpf: '888.888.888-88',
      };

      findByCpf.mockResolvedValue(null);
      PersonAdapter.fromTransaction.mockReturnValue(newPersonData);
      insertPerson.mockRejectedValue(new Error('Insert failed'));

      await expect(
        PersonProcessor.process(transaction, processedEntities, mockSession)
      ).rejects.toThrow('Insert failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error processing person transaction:',
        'Insert failed'
      );
    });

    test('should handle new person creation when transaction update fails', async () => {
      const transaction = {
        id: 'transaction456',
        companyCnpj: '987.654.321-09',
        companyName: 'Jane Smith',
      };

      const newPersonData = {
        fullName: 'Jane Smith',
        cpf: '987.654.321-09',
      };

      const createdPerson = {
        id: 'person456',
        ...newPersonData,
      };

      findByCpf.mockResolvedValue(null);
      PersonAdapter.fromTransaction.mockReturnValue(newPersonData);
      insertPerson.mockResolvedValue(createdPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValue(false); // Update failed

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual({ created: 1, skipped: 0, updated: 0 });
      expect(processedEntities.get('987.654.321-09')).toBe(true);
    });
  });

  describe('findExisting', () => {
    test('should find person by CPF when companyCnpj exists', async () => {
      const transaction = {
        companyCnpj: '123.456.789-01',
        companyName: 'John Doe',
      };

      const existingPerson = {
        id: 'person123',
        cpf: '123.456.789-01',
        fullName: 'John Doe',
      };

      findByCpf.mockResolvedValue(existingPerson);

      const result = await PersonProcessor.findExisting(
        transaction,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith('123.456.789-01', mockSession);
      expect(result).toBe(existingPerson);
    });

    test('should return null when companyCnpj is missing', async () => {
      const transaction = {
        companyName: 'John Doe',
      };

      const result = await PersonProcessor.findExisting(
        transaction,
        mockSession
      );

      expect(findByCpf).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should return null when companyCnpj is falsy', async () => {
      const falsyValues = [null, undefined, '', 0, false];

      for (const falsyValue of falsyValues) {
        const transaction = {
          companyCnpj: falsyValue,
          companyName: 'Test Person',
        };

        const result = await PersonProcessor.findExisting(
          transaction,
          mockSession
        );

        expect(result).toBeNull();
      }

      expect(findByCpf).not.toHaveBeenCalled();
    });

    test('should handle repository errors', async () => {
      const transaction = {
        companyCnpj: '123.456.789-01',
      };

      findByCpf.mockRejectedValue(new Error('Database error'));

      await expect(
        PersonProcessor.findExisting(transaction, mockSession)
      ).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    test('should create person with session', async () => {
      const personData = {
        fullName: 'New Person',
        cpf: '123.456.789-01',
        status: 'active',
      };

      const createdPerson = {
        id: 'person123',
        ...personData,
      };

      insertPerson.mockResolvedValue(createdPerson);

      const result = await PersonProcessor.create(personData, mockSession);

      expect(insertPerson).toHaveBeenCalledWith(personData, mockSession);
      expect(result).toBe(createdPerson);
    });

    test('should handle creation errors', async () => {
      const personData = {
        fullName: 'Error Person',
      };

      insertPerson.mockRejectedValue(new Error('Creation failed'));

      await expect(
        PersonProcessor.create(personData, mockSession)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete person processing workflow', async () => {
      const transaction = {
        id: 'transaction-integration',
        companyCnpj: '111.222.333-44',
        companyName: 'Integration Test Person',
        companySellerName: 'Jane Seller',
      };

      const personData = {
        fullName: 'Integration Test Person',
        cpf: '111.222.333-44',
        status: 'active',
        notes: 'Nome do vendedor: Jane Seller',
      };

      const createdPerson = {
        id: 'person-integration',
        ...personData,
      };

      // Mock successful flow
      findByCpf.mockResolvedValue(null);
      PersonAdapter.fromTransaction.mockReturnValue(personData);
      insertPerson.mockResolvedValue(createdPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValue(true);

      const result = await PersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      // Verify complete workflow
      expect(findByCpf).toHaveBeenCalledWith('111.222.333-44', mockSession);
      expect(PersonAdapter.fromTransaction).toHaveBeenCalledWith(transaction);
      expect(insertPerson).toHaveBeenCalledWith(personData, mockSession);
      expect(TransactionUpdater.updateWithPersonId).toHaveBeenCalledWith(
        transaction,
        'person-integration',
        mockSession
      );

      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('111.222.333-44')).toBe(true);
    });

    test('should handle multiple transactions with same CPF', async () => {
      const baseCpf = '222.333.444-55';
      const processedEntities = new Map();

      const transaction1 = {
        id: 'transaction1',
        companyCnpj: baseCpf,
        companyName: 'Same Person',
      };

      const transaction2 = {
        id: 'transaction2',
        companyCnpj: baseCpf,
        companyName: 'Same Person',
      };

      const existingPerson = {
        id: 'person-same',
        fullName: 'Same Person',
        cpf: baseCpf,
      };

      findByCpf.mockResolvedValue(existingPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValue(true);

      // Process first transaction
      const result1 = await PersonProcessor.process(
        transaction1,
        processedEntities,
        mockSession
      );

      // Process second transaction
      const result2 = await PersonProcessor.process(
        transaction2,
        processedEntities,
        mockSession
      );

      expect(result1).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(result2).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get(baseCpf)).toBe(true);
      expect(findByCpf).toHaveBeenCalledTimes(2);
    });

    test('should handle different scenarios within same test', async () => {
      // Scenario 1: Existing person
      const existingTransaction = {
        id: 'existing-transaction',
        companyCnpj: '100.200.300-40',
        companyName: 'Existing Person',
      };

      const existingPerson = {
        id: 'existing-person',
        fullName: 'Existing Person',
        cpf: '100.200.300-40',
      };

      findByCpf.mockResolvedValueOnce(existingPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValueOnce(true);

      const existingResult = await PersonProcessor.process(
        existingTransaction,
        processedEntities,
        mockSession
      );

      expect(existingResult).toEqual({ created: 0, skipped: 1, updated: 1 });

      // Scenario 2: New person
      const newTransaction = {
        id: 'new-transaction',
        companyCnpj: '400.500.600-70',
        companyName: 'New Person',
      };

      const newPersonData = {
        fullName: 'New Person',
        cpf: '400.500.600-70',
      };

      const createdPerson = {
        id: 'new-person',
        ...newPersonData,
      };

      findByCpf.mockResolvedValueOnce(null);
      PersonAdapter.fromTransaction.mockReturnValueOnce(newPersonData);
      insertPerson.mockResolvedValueOnce(createdPerson);
      TransactionUpdater.updateWithPersonId.mockResolvedValueOnce(true);

      const newResult = await PersonProcessor.process(
        newTransaction,
        processedEntities,
        mockSession
      );

      expect(newResult).toEqual({ created: 1, skipped: 0, updated: 1 });

      // Verify both persons are marked as processed
      expect(processedEntities.get('100.200.300-40')).toBe(true);
      expect(processedEntities.get('400.500.600-70')).toBe(true);
    });
  });
});

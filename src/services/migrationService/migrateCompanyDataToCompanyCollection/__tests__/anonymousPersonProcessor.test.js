/**
 * Unit tests for AnonymousPersonProcessor
 * Tests all anonymous person processing operations
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { AnonymousPersonProcessor } from '../anonymousPersonProcessor.js';
import { EMPTY_RESULT } from '../types.js';

// Mock dependencies
jest.unstable_mockModule('../../../repository/personRepository.js', () => ({
  findByCpf: jest.fn(),
  insert: jest.fn(),
}));

jest.unstable_mockModule('./entityAdapters.js', () => ({
  AnonymousPersonAdapter: {
    fromTransaction: jest.fn(),
  },
}));

jest.unstable_mockModule('./transactionUpdater.js', () => ({
  TransactionUpdater: {
    updateWithAnonymousPersonId: jest.fn(),
  },
}));

const { findByCpf, insert: insertPerson } = await import(
  '../../../repository/personRepository.js'
);
const { AnonymousPersonAdapter } = await import('./entityAdapters.js');
const { TransactionUpdater } = await import('./transactionUpdater.js');

// Mock console methods
const originalConsole = console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
  };
});

describe('AnonymousPersonProcessor', () => {
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
    test('should handle existing anonymous person and update transaction', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '123.***.*89-12',
        companyName: 'Anonymous Person',
      };

      const existingPerson = {
        id: 'anonymous-person123',
        fullName: 'Anonymous Person',
        cpf: '123.***.*89-12',
        status: 'anonymous',
      };

      findByCpf.mockResolvedValue(existingPerson);
      TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(true);

      const result = await AnonymousPersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith('123.***.*89-12', mockSession);
      expect(
        TransactionUpdater.updateWithAnonymousPersonId
      ).toHaveBeenCalledWith(transaction, 'anonymous-person123', mockSession);
      expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get('123.***.*89-12')).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '✅ Anonymous person already exists: Anonymous Person'
      );
    });

    test('should handle existing anonymous person when transaction update fails', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '123.***.*89-12',
        companyName: 'Anonymous Person',
      };

      const existingPerson = {
        id: 'anonymous-person123',
        fullName: 'Anonymous Person',
        cpf: '123.***.*89-12',
      };

      findByCpf.mockResolvedValue(existingPerson);
      TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(false); // Update skipped

      const result = await AnonymousPersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual({ created: 0, skipped: 1, updated: 0 });
      expect(processedEntities.get('123.***.*89-12')).toBe(true);
    });

    test('should create new anonymous person when none exists', async () => {
      const transaction = {
        id: 'transaction456',
        companyCnpj: '987.***.*21-09',
        companyName: 'New Anonymous Person',
      };

      const newPersonData = {
        fullName: 'New Anonymous Person',
        cpf: '987.***.*21-09',
        status: 'anonymous',
        notes: 'Pessoa criada a partir de CPF anonimizado em transação',
      };

      const createdPerson = {
        id: 'anonymous-person456',
        ...newPersonData,
      };

      findByCpf.mockResolvedValue(null);
      AnonymousPersonAdapter.fromTransaction.mockReturnValue(newPersonData);
      insertPerson.mockResolvedValue(createdPerson);
      TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(true);

      const result = await AnonymousPersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith('987.***.*21-09', mockSession);
      expect(AnonymousPersonAdapter.fromTransaction).toHaveBeenCalledWith(
        transaction
      );
      expect(insertPerson).toHaveBeenCalledWith(newPersonData, mockSession);
      expect(
        TransactionUpdater.updateWithAnonymousPersonId
      ).toHaveBeenCalledWith(transaction, 'anonymous-person456', mockSession);
      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('987.***.*21-09')).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '🆕 Created anonymous person: New Anonymous Person'
      );
    });

    test('should handle case when AnonymousPersonAdapter returns null', async () => {
      const transaction = {
        id: 'transaction789',
        companyCnpj: '111.***.*11-11',
        companyName: 'Invalid Anonymous Person',
      };

      findByCpf.mockResolvedValue(null);
      AnonymousPersonAdapter.fromTransaction.mockReturnValue(null); // Invalid person data

      const result = await AnonymousPersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual(EMPTY_RESULT);
      expect(insertPerson).not.toHaveBeenCalled();
      expect(
        TransactionUpdater.updateWithAnonymousPersonId
      ).not.toHaveBeenCalled();
      expect(processedEntities.has('111.***.*11-11')).toBe(false);
    });

    test('should handle errors during processing', async () => {
      const transaction = {
        id: 'transaction999',
        companyCnpj: '999.***.*99-99',
        companyName: 'Error Anonymous Person',
      };

      const error = new Error('Database connection failed');
      findByCpf.mockRejectedValue(error);

      await expect(
        AnonymousPersonProcessor.process(
          transaction,
          processedEntities,
          mockSession
        )
      ).rejects.toThrow('Database connection failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error processing anonymous person transaction:',
        'Database connection failed'
      );
    });

    test('should handle errors during anonymous person creation', async () => {
      const transaction = {
        id: 'transaction888',
        companyCnpj: '888.***.*88-88',
        companyName: 'Error Anonymous Person',
      };

      const newPersonData = {
        fullName: 'Error Anonymous Person',
        cpf: '888.***.*88-88',
        status: 'anonymous',
      };

      findByCpf.mockResolvedValue(null);
      AnonymousPersonAdapter.fromTransaction.mockReturnValue(newPersonData);
      insertPerson.mockRejectedValue(new Error('Insert failed'));

      await expect(
        AnonymousPersonProcessor.process(
          transaction,
          processedEntities,
          mockSession
        )
      ).rejects.toThrow('Insert failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error processing anonymous person transaction:',
        'Insert failed'
      );
    });

    test('should handle new anonymous person creation when transaction update fails', async () => {
      const transaction = {
        id: 'transaction456',
        companyCnpj: '987.***.*21-09',
        companyName: 'New Anonymous Person',
      };

      const newPersonData = {
        fullName: 'New Anonymous Person',
        cpf: '987.***.*21-09',
        status: 'anonymous',
      };

      const createdPerson = {
        id: 'anonymous-person456',
        ...newPersonData,
      };

      findByCpf.mockResolvedValue(null);
      AnonymousPersonAdapter.fromTransaction.mockReturnValue(newPersonData);
      insertPerson.mockResolvedValue(createdPerson);
      TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(false); // Update failed

      const result = await AnonymousPersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual({ created: 1, skipped: 0, updated: 0 });
      expect(processedEntities.get('987.***.*21-09')).toBe(true);
    });

    test('should handle various anonymized CPF patterns', async () => {
      const anonymizedPatterns = [
        '123.***.*89-12',
        '***.456.789-**',
        '###.###.###-##',
        '12x.xxx.x89.12',
        '123....789',
      ];

      for (const pattern of anonymizedPatterns) {
        jest.clearAllMocks();

        const transaction = {
          id: `transaction-${pattern}`,
          companyCnpj: pattern,
          companyName: 'Anonymous Test',
        };

        const newPersonData = {
          fullName: 'Anonymous Test',
          cpf: pattern,
          status: 'anonymous',
        };

        const createdPerson = {
          id: `anonymous-person-${pattern}`,
          ...newPersonData,
        };

        findByCpf.mockResolvedValue(null);
        AnonymousPersonAdapter.fromTransaction.mockReturnValue(newPersonData);
        insertPerson.mockResolvedValue(createdPerson);
        TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(true);

        const result = await AnonymousPersonProcessor.process(
          transaction,
          new Map(),
          mockSession
        );

        expect(findByCpf).toHaveBeenCalledWith(pattern, mockSession);
        expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      }
    });
  });

  describe('findExisting', () => {
    test('should find anonymous person by anonymized CPF when companyCnpj exists', async () => {
      const transaction = {
        companyCnpj: '123.***.*89-12',
        companyName: 'Anonymous Person',
      };

      const existingPerson = {
        id: 'anonymous-person123',
        cpf: '123.***.*89-12',
        fullName: 'Anonymous Person',
        status: 'anonymous',
      };

      findByCpf.mockResolvedValue(existingPerson);

      const result = await AnonymousPersonProcessor.findExisting(
        transaction,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith('123.***.*89-12', mockSession);
      expect(result).toBe(existingPerson);
    });

    test('should return null when companyCnpj is missing', async () => {
      const transaction = {
        companyName: 'Anonymous Person',
      };

      const result = await AnonymousPersonProcessor.findExisting(
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
          companyName: 'Test Anonymous Person',
        };

        const result = await AnonymousPersonProcessor.findExisting(
          transaction,
          mockSession
        );

        expect(result).toBeNull();
      }

      expect(findByCpf).not.toHaveBeenCalled();
    });

    test('should handle repository errors', async () => {
      const transaction = {
        companyCnpj: '123.***.*89-12',
      };

      findByCpf.mockRejectedValue(new Error('Database error'));

      await expect(
        AnonymousPersonProcessor.findExisting(transaction, mockSession)
      ).rejects.toThrow('Database error');
    });

    test('should search by exact anonymized pattern', async () => {
      const anonymizedCpf = '***.***.***-**';
      const transaction = {
        companyCnpj: anonymizedCpf,
        companyName: 'Fully Anonymous',
      };

      const existingPerson = {
        id: 'fully-anonymous',
        cpf: anonymizedCpf,
        status: 'anonymous',
      };

      findByCpf.mockResolvedValue(existingPerson);

      const result = await AnonymousPersonProcessor.findExisting(
        transaction,
        mockSession
      );

      expect(findByCpf).toHaveBeenCalledWith(anonymizedCpf, mockSession);
      expect(result).toBe(existingPerson);
    });
  });

  describe('create', () => {
    test('should create anonymous person with session', async () => {
      const personData = {
        fullName: 'New Anonymous Person',
        cpf: '123.***.*89-12',
        status: 'anonymous',
        notes: 'Pessoa criada a partir de CPF anonimizado em transação',
      };

      const createdPerson = {
        id: 'anonymous-person123',
        ...personData,
      };

      insertPerson.mockResolvedValue(createdPerson);

      const result = await AnonymousPersonProcessor.create(
        personData,
        mockSession
      );

      expect(insertPerson).toHaveBeenCalledWith(personData, mockSession);
      expect(result).toBe(createdPerson);
    });

    test('should handle creation errors', async () => {
      const personData = {
        fullName: 'Error Anonymous Person',
        cpf: '999.***.*99-99',
        status: 'anonymous',
      };

      insertPerson.mockRejectedValue(new Error('Creation failed'));

      await expect(
        AnonymousPersonProcessor.create(personData, mockSession)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete anonymous person processing workflow', async () => {
      const transaction = {
        id: 'transaction-integration',
        companyCnpj: '111.***.*33-44',
        companyName: 'Integration Test Anonymous',
        companySellerName: 'Anonymous Seller',
      };

      const personData = {
        fullName: 'Integration Test Anonymous',
        cpf: '111.***.*33-44',
        status: 'anonymous',
        notes:
          'Pessoa criada a partir de CPF anonimizado em transação. Vendedor: Anonymous Seller',
      };

      const createdPerson = {
        id: 'anonymous-person-integration',
        ...personData,
      };

      // Mock successful flow
      findByCpf.mockResolvedValue(null);
      AnonymousPersonAdapter.fromTransaction.mockReturnValue(personData);
      insertPerson.mockResolvedValue(createdPerson);
      TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(true);

      const result = await AnonymousPersonProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      // Verify complete workflow
      expect(findByCpf).toHaveBeenCalledWith('111.***.*33-44', mockSession);
      expect(AnonymousPersonAdapter.fromTransaction).toHaveBeenCalledWith(
        transaction
      );
      expect(insertPerson).toHaveBeenCalledWith(personData, mockSession);
      expect(
        TransactionUpdater.updateWithAnonymousPersonId
      ).toHaveBeenCalledWith(
        transaction,
        'anonymous-person-integration',
        mockSession
      );

      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('111.***.*33-44')).toBe(true);
    });

    test('should handle multiple transactions with same anonymized CPF', async () => {
      const baseCpf = '222.***.*44-55';
      const processedEntities = new Map();

      const transaction1 = {
        id: 'transaction1',
        companyCnpj: baseCpf,
        companyName: 'Same Anonymous Person',
      };

      const transaction2 = {
        id: 'transaction2',
        companyCnpj: baseCpf,
        companyName: 'Same Anonymous Person',
      };

      const existingPerson = {
        id: 'anonymous-person-same',
        fullName: 'Same Anonymous Person',
        cpf: baseCpf,
        status: 'anonymous',
      };

      findByCpf.mockResolvedValue(existingPerson);
      TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValue(true);

      // Process first transaction
      const result1 = await AnonymousPersonProcessor.process(
        transaction1,
        processedEntities,
        mockSession
      );

      // Process second transaction
      const result2 = await AnonymousPersonProcessor.process(
        transaction2,
        processedEntities,
        mockSession
      );

      expect(result1).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(result2).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get(baseCpf)).toBe(true);
      expect(findByCpf).toHaveBeenCalledTimes(2);
    });

    test('should distinguish between different anonymization patterns', async () => {
      const patterns = ['123.***.*89-12', '123.xxx.x89-12', '123.###.#89-12'];

      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const transaction = {
          id: `transaction-${i}`,
          companyCnpj: pattern,
          companyName: `Anonymous Person ${i}`,
        };

        const personData = {
          fullName: `Anonymous Person ${i}`,
          cpf: pattern,
          status: 'anonymous',
        };

        const createdPerson = {
          id: `anonymous-person-${i}`,
          ...personData,
        };

        findByCpf.mockResolvedValueOnce(null);
        AnonymousPersonAdapter.fromTransaction.mockReturnValueOnce(personData);
        insertPerson.mockResolvedValueOnce(createdPerson);
        TransactionUpdater.updateWithAnonymousPersonId.mockResolvedValueOnce(
          true
        );

        const result = await AnonymousPersonProcessor.process(
          transaction,
          new Map(),
          mockSession
        );

        expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
        expect(findByCpf).toHaveBeenCalledWith(pattern, mockSession);
      }

      expect(findByCpf).toHaveBeenCalledTimes(patterns.length);
      expect(AnonymousPersonAdapter.fromTransaction).toHaveBeenCalledTimes(
        patterns.length
      );
      expect(insertPerson).toHaveBeenCalledTimes(patterns.length);
    });
  });
});

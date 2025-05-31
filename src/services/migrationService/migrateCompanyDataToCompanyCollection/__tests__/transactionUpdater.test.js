/**
 * Unit tests for TransactionUpdater
 * Tests transaction update operations with entity references
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { TransactionUpdater } from '../transactionUpdater.js';

// Mock the transaction repository
jest.unstable_mockModule(
  '../../../repository/transactionRepository.js',
  () => ({
    updateById: jest.fn(),
  })
);

const { updateById: updateTransaction } = await import(
  '../../../repository/transactionRepository.js'
);

// Mock console methods to avoid noise during testing
const originalConsole = console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
  };
});

describe('TransactionUpdater', () => {
  const mockSession = { id: 'session123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.console = originalConsole;
  });

  describe('updateWithCompanyId', () => {
    test('should update transaction when companyId is not set', async () => {
      const transaction = {
        id: 'transaction123',
        companyId: null,
        companyName: 'Test Company',
        companySellerName: 'John Seller',
        companyCnpj: '12.345.678/0001-95',
      };
      const companyId = 'company123';

      updateTransaction.mockResolvedValue({ modifiedCount: 1 });

      const result = await TransactionUpdater.updateWithCompanyId(
        transaction,
        companyId,
        mockSession
      );

      expect(result).toBe(true);
      expect(updateTransaction).toHaveBeenCalledWith(
        'transaction123',
        {
          companyId: 'company123',
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        },
        mockSession
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔗 Updated transaction transaction123 with companyId: company123 and removed redundant company fields'
      );
    });

    test('should skip update when companyId is already set', async () => {
      const transaction = {
        id: 'transaction123',
        companyId: 'existing-company-id',
        companyName: 'Test Company',
      };
      const companyId = 'company123';

      const result = await TransactionUpdater.updateWithCompanyId(
        transaction,
        companyId,
        mockSession
      );

      expect(result).toBe(false);
      expect(updateTransaction).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should skip update when companyId is undefined but truthy', async () => {
      const transaction = {
        id: 'transaction123',
        companyId: 'some-existing-id',
      };
      const companyId = 'company123';

      const result = await TransactionUpdater.updateWithCompanyId(
        transaction,
        companyId,
        mockSession
      );

      expect(result).toBe(false);
      expect(updateTransaction).not.toHaveBeenCalled();
    });

    test('should handle repository update errors', async () => {
      const transaction = {
        id: 'transaction123',
        companyId: null,
      };
      const companyId = 'company123';
      const error = new Error('Database connection failed');

      updateTransaction.mockRejectedValue(error);

      await expect(
        TransactionUpdater.updateWithCompanyId(
          transaction,
          companyId,
          mockSession
        )
      ).rejects.toThrow('Database connection failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error updating transaction transaction123 with companyId:',
        'Database connection failed'
      );
    });

    test('should handle various falsy companyId values in transaction', async () => {
      const falsyValues = [null, undefined, '', 0, false];
      const companyId = 'company123';

      for (const falsyValue of falsyValues) {
        jest.clearAllMocks();
        updateTransaction.mockResolvedValue({ modifiedCount: 1 });

        const transaction = {
          id: `transaction-${falsyValue}`,
          companyId: falsyValue,
        };

        const result = await TransactionUpdater.updateWithCompanyId(
          transaction,
          companyId,
          mockSession
        );

        expect(result).toBe(true);
        expect(updateTransaction).toHaveBeenCalled();
      }
    });
  });

  describe('updateWithPersonId', () => {
    test('should update transaction when companyId is not set', async () => {
      const transaction = {
        id: 'transaction456',
        companyId: null,
        companyName: 'John Doe',
        companySellerName: 'John Doe',
        companyCnpj: '123.456.789-01',
      };
      const personId = 'person456';

      updateTransaction.mockResolvedValue({ modifiedCount: 1 });

      const result = await TransactionUpdater.updateWithPersonId(
        transaction,
        personId,
        mockSession
      );

      expect(result).toBe(true);
      expect(updateTransaction).toHaveBeenCalledWith(
        'transaction456',
        {
          companyId: 'person456', // Uses companyId field for person ID
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        },
        mockSession
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔗 Updated transaction transaction456 with personId: person456 and removed redundant company fields'
      );
    });

    test('should skip update when companyId is already set', async () => {
      const transaction = {
        id: 'transaction456',
        companyId: 'existing-person-id',
        companyName: 'John Doe',
      };
      const personId = 'person456';

      const result = await TransactionUpdater.updateWithPersonId(
        transaction,
        personId,
        mockSession
      );

      expect(result).toBe(false);
      expect(updateTransaction).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should handle repository update errors gracefully', async () => {
      const transaction = {
        id: 'transaction456',
        companyId: null,
      };
      const personId = 'person456';
      const error = new Error('Network timeout');

      updateTransaction.mockRejectedValue(error);

      const result = await TransactionUpdater.updateWithPersonId(
        transaction,
        personId,
        mockSession
      );

      expect(result).toBe(false); // Should return false on error, not throw
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error updating transaction transaction456 with personId:',
        'Network timeout'
      );
    });

    test('should update successfully with undefined session', async () => {
      const transaction = {
        id: 'transaction456',
        companyId: null,
      };
      const personId = 'person456';

      updateTransaction.mockResolvedValue({ modifiedCount: 1 });

      const result = await TransactionUpdater.updateWithPersonId(
        transaction,
        personId,
        undefined
      );

      expect(result).toBe(true);
      expect(updateTransaction).toHaveBeenCalledWith(
        'transaction456',
        {
          companyId: 'person456',
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        },
        undefined
      );
    });
  });

  describe('updateWithAnonymousPersonId', () => {
    test('should delegate to updateWithPersonId method', async () => {
      const transaction = {
        id: 'transaction789',
        companyId: null,
        companyName: 'Anonymous Person',
        companyCnpj: '123.***.*89-12',
      };
      const anonymousPersonId = 'anonymous-person789';

      updateTransaction.mockResolvedValue({ modifiedCount: 1 });

      const result = await TransactionUpdater.updateWithAnonymousPersonId(
        transaction,
        anonymousPersonId,
        mockSession
      );

      expect(result).toBe(true);
      expect(updateTransaction).toHaveBeenCalledWith(
        'transaction789',
        {
          companyId: 'anonymous-person789',
          $unset: {
            companyName: '',
            companySellerName: '',
            companyCnpj: '',
          },
        },
        mockSession
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔗 Updated transaction transaction789 with personId: anonymous-person789 and removed redundant company fields'
      );
    });

    test('should handle errors the same way as updateWithPersonId', async () => {
      const transaction = {
        id: 'transaction789',
        companyId: null,
      };
      const anonymousPersonId = 'anonymous-person789';
      const error = new Error('Update failed');

      updateTransaction.mockRejectedValue(error);

      const result = await TransactionUpdater.updateWithAnonymousPersonId(
        transaction,
        anonymousPersonId,
        mockSession
      );

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error updating transaction transaction789 with personId:',
        'Update failed'
      );
    });

    test('should skip update when companyId is already set', async () => {
      const transaction = {
        id: 'transaction789',
        companyId: 'existing-id',
      };
      const anonymousPersonId = 'anonymous-person789';

      const result = await TransactionUpdater.updateWithAnonymousPersonId(
        transaction,
        anonymousPersonId,
        mockSession
      );

      expect(result).toBe(false);
      expect(updateTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete update workflow for different entity types', async () => {
      updateTransaction.mockResolvedValue({ modifiedCount: 1 });

      const baseTransaction = {
        companyId: null,
        companyName: 'Test Entity',
        companySellerName: 'John Seller',
        companyCnpj: '12345678901',
      };

      // Test company update
      const companyTransaction = {
        ...baseTransaction,
        id: 'transaction-company',
      };
      const companyResult = await TransactionUpdater.updateWithCompanyId(
        companyTransaction,
        'company123',
        mockSession
      );
      expect(companyResult).toBe(true);

      // Test person update
      const personTransaction = {
        ...baseTransaction,
        id: 'transaction-person',
      };
      const personResult = await TransactionUpdater.updateWithPersonId(
        personTransaction,
        'person456',
        mockSession
      );
      expect(personResult).toBe(true);

      // Test anonymous person update
      const anonymousTransaction = {
        ...baseTransaction,
        id: 'transaction-anonymous',
      };
      const anonymousResult =
        await TransactionUpdater.updateWithAnonymousPersonId(
          anonymousTransaction,
          'anonymous789',
          mockSession
        );
      expect(anonymousResult).toBe(true);

      // Verify all updates were called with correct parameters
      expect(updateTransaction).toHaveBeenCalledTimes(3);
    });

    test('should maintain consistent update structure across all methods', async () => {
      updateTransaction.mockResolvedValue({ modifiedCount: 1 });

      const transaction = {
        id: 'transaction-test',
        companyId: null,
        companyName: 'Test',
        companySellerName: 'Seller',
        companyCnpj: '12345678901',
      };

      // Test all update methods
      await TransactionUpdater.updateWithCompanyId(
        transaction,
        'entity1',
        mockSession
      );
      await TransactionUpdater.updateWithPersonId(
        { ...transaction, id: 'transaction-test-2', companyId: null },
        'entity2',
        mockSession
      );
      await TransactionUpdater.updateWithAnonymousPersonId(
        { ...transaction, id: 'transaction-test-3', companyId: null },
        'entity3',
        mockSession
      );

      // Verify consistent update structure
      const calls = updateTransaction.mock.calls;
      calls.forEach(([, updateData]) => {
        expect(updateData).toHaveProperty('$unset');
        expect(updateData.$unset).toEqual({
          companyName: '',
          companySellerName: '',
          companyCnpj: '',
        });
      });
    });
  });
});

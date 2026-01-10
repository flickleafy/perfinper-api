/**
 * @fileoverview Tests for Company Processor
 * Tests company processing logic with dry-run support
 */

import { jest } from '@jest/globals';
import { EMPTY_RESULT, DOCUMENT_TYPES } from './types.js';

// Define mock functions first
const mockFindByCnpj = jest.fn();
const mockInsertCompany = jest.fn();
const mockUpdateWithCompanyId = jest.fn();
const mockFromTransaction = jest.fn();
const mockAddExistingEntity = jest.fn();
const mockIncrementTransactionUpdates = jest.fn();
const mockAddCnpjRecord = jest.fn();
const mockAddFailedRecord = jest.fn();

// Mock the dynamic import of dryRunUtils.js
jest.unstable_mockModule('./dryRunUtils.js', () => ({
  addExistingEntity: mockAddExistingEntity,
  incrementTransactionUpdates: mockIncrementTransactionUpdates,
  addCnpjRecord: mockAddCnpjRecord,
  addFailedRecord: mockAddFailedRecord,
}));

jest.unstable_mockModule('../../../repository/companyRepository.js', () => ({
  findByCnpj: mockFindByCnpj,
  insert: mockInsertCompany,
}));

jest.unstable_mockModule('./transactionUpdater.js', () => ({
  TransactionUpdater: {
    updateWithCompanyId: mockUpdateWithCompanyId,
  },
}));

jest.unstable_mockModule('./entityAdapters.js', () => ({
  CompanyAdapter: {
    fromTransaction: mockFromTransaction,
  },
}));

const { CompanyProcessor } = await import('./companyProcessor.js');

describe('CompanyProcessor', () => {
  let mockSession;
  let processedEntities;
  let mockDryRunStats;
  let mockTransaction;

  beforeEach(async () => {
    // 1. Reset the state of mock functions (implementation and calls)
    mockFindByCnpj.mockReset();
    mockInsertCompany.mockReset();
    mockUpdateWithCompanyId.mockReset();
    mockFromTransaction.mockReset();
    mockAddExistingEntity.mockReset();
    mockIncrementTransactionUpdates.mockReset();
    mockAddCnpjRecord.mockReset();
    mockAddFailedRecord.mockReset();

    mockSession = { sessionId: 'test-session' };
    processedEntities = new Map();
    mockDryRunStats = {
      existingEntities: [],
      transactionUpdates: 0,
      cnpjRecords: [],
      failedRecords: [],
    };

    mockTransaction = {
      _id: 'transaction-123',
      companyCnpj: '12.345.678/0001-90',
      companyName: 'Test Company Ltd',
      companySellerName: 'John Seller',
      documentType: DOCUMENT_TYPES.CNPJ,
      amount: 1000.5,
      date: new Date('2023-01-15'),
    };
  });

  describe('process method', () => {
    describe('when company exists', () => {
      test('should skip existing company and update transaction', async () => {
        const existingCompany = {
          id: 'company-123',
          cnpj: '12.345.678/0001-90',
          corporateName: 'Existing Company',
        };

        mockFindByCnpj.mockResolvedValue(existingCompany);
        mockUpdateWithCompanyId.mockResolvedValue(true);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false
        );

        expect(mockFindByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90',
          mockSession
        );
        expect(mockUpdateWithCompanyId).toHaveBeenCalledWith(
          mockTransaction,
          'company-123',
          mockSession
        );
        expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
        expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy();
      });

      test('should handle dry-run mode for existing company', async () => {
        const existingCompany = {
          id: 'company-123',
          cnpj: '12.345.678/0001-90',
          corporateName: 'Existing Company',
        };

        mockFindByCnpj.mockResolvedValue(existingCompany);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          true,
          mockDryRunStats
        );

        expect(mockFindByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90',
          mockSession
        );
        expect(mockUpdateWithCompanyId).not.toHaveBeenCalled();
        expect(mockAddExistingEntity).toHaveBeenCalledWith(
          mockDryRunStats,
          '12.345.678/0001-90',
          existingCompany,
          'company'
        );
        expect(mockIncrementTransactionUpdates).toHaveBeenCalledWith(
          mockDryRunStats
        );
        expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
      });

      test('should handle dry-run mode for existing company without dryRunStats', async () => {
        const existingCompany = {
          id: 'company-123',
          cnpj: '12.345.678/0001-90',
          corporateName: 'Existing Company',
        };

        mockFindByCnpj.mockResolvedValue(existingCompany);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          true, // dryRun = true
          null // dryRunStats = null
        );

        expect(mockFindByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90',
          mockSession
        );
        expect(mockUpdateWithCompanyId).not.toHaveBeenCalled();
        expect(mockAddExistingEntity).not.toHaveBeenCalled(); // Should not be called when dryRunStats is null
        expect(mockIncrementTransactionUpdates).not.toHaveBeenCalled();
        expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
      });

      test('should handle transaction update failure', async () => {
        const existingCompany = {
          id: 'company-123',
          cnpj: '12.345.678/0001-90',
          corporateName: 'Existing Company',
        };

        mockFindByCnpj.mockResolvedValue(existingCompany);
        mockUpdateWithCompanyId.mockResolvedValue(false);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false
        );

        expect(result).toEqual({ created: 0, skipped: 1, updated: 0 });
      });

      test('should handle existing company with only tradeName (no corporateName)', async () => {
        const existingCompany = {
          id: 'company-123',
          cnpj: '12.345.678/0001-90',
          corporateName: null, // No corporate name
          tradeName: 'Test Trade Name Only',
        };

        mockFindByCnpj.mockResolvedValue(existingCompany);
        mockUpdateWithCompanyId.mockResolvedValue(true);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false
        );

        expect(mockFindByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90',
          mockSession
        );
        expect(mockUpdateWithCompanyId).toHaveBeenCalledWith(
          mockTransaction,
          'company-123',
          mockSession
        );
        expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
        expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy();
      });

      test('should use default dryRun parameter when not specified', async () => {
        const existingCompany = {
          id: 'company-123',
          cnpj: '12.345.678/0001-90',
          corporateName: 'Existing Company',
        };

        mockFindByCnpj.mockResolvedValue(existingCompany);
        mockUpdateWithCompanyId.mockResolvedValue(true);

        // Call without explicit dryRun parameter to test default value
        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession
          // Note: not passing dryRun parameter, should default to false
        );

        expect(mockFindByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90',
          mockSession
        );
        expect(mockUpdateWithCompanyId).toHaveBeenCalledWith(
          mockTransaction,
          'company-123',
          mockSession
        );
        expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
        expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy();
      });
    });

    describe('when creating new company', () => {
      test('should create new company successfully', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: 'Test Company Ltd',
          tradeName: 'Test Company Ltd',
        };

        const createdCompany = {
          id: 'new-company-123',
          ...newCompanyData,
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);
        mockInsertCompany.mockResolvedValue(createdCompany);
        mockUpdateWithCompanyId.mockResolvedValue(true);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false
        );

        expect(mockFindByCnpj).toHaveBeenCalledWith(
          '12.345.678/0001-90',
          mockSession
        );
        expect(mockFromTransaction).toHaveBeenCalledWith(mockTransaction);
        expect(mockInsertCompany).toHaveBeenCalledWith(
          newCompanyData,
          mockSession
        );
        expect(mockUpdateWithCompanyId).toHaveBeenCalledWith(
          mockTransaction,
          'new-company-123',
          mockSession
        );
        expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
        expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy();
      });

      test('should handle dry-run mode for new company', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: 'Test Company Ltd',
          tradeName: 'Test Company Ltd',
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          true,
          mockDryRunStats
        );

        expect(mockFromTransaction).toHaveBeenCalledWith(mockTransaction);
        expect(mockInsertCompany).not.toHaveBeenCalled();
        expect(mockUpdateWithCompanyId).not.toHaveBeenCalled();
        expect(mockAddCnpjRecord).toHaveBeenCalledWith(
          mockDryRunStats,
          '12.345.678/0001-90',
          newCompanyData,
          mockTransaction
        );
        expect(mockIncrementTransactionUpdates).toHaveBeenCalledWith(
          mockDryRunStats
        );
        expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      });

      test('should handle dry-run mode for new company without dryRunStats', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: null, // Test when corporateName is null
          tradeName: 'Test Company Ltd',
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          true, // dryRun = true
          null // dryRunStats = null
        );

        expect(mockFromTransaction).toHaveBeenCalledWith(mockTransaction);
        expect(mockInsertCompany).not.toHaveBeenCalled();
        expect(mockUpdateWithCompanyId).not.toHaveBeenCalled();
        expect(mockAddCnpjRecord).not.toHaveBeenCalled(); // Should not be called when dryRunStats is null
        expect(mockIncrementTransactionUpdates).not.toHaveBeenCalled();
        expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      });

      test('should return empty result when adapter returns null', async () => {
        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(null);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false
        );

        expect(mockFromTransaction).toHaveBeenCalledWith(mockTransaction);
        expect(mockInsertCompany).not.toHaveBeenCalled();
        expect(result).toEqual(EMPTY_RESULT);
      });

      test('should handle new company creation but transaction update failure (not dry run)', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: 'Test Company Ltd',
          tradeName: 'Test Company Ltd',
        };
        const createdCompany = {
          id: 'new-company-123',
          ...newCompanyData,
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);
        mockInsertCompany.mockResolvedValue(createdCompany);
        mockUpdateWithCompanyId.mockResolvedValue(false); // Simulate transaction update failure

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false // Not dry run
        );

        expect(mockInsertCompany).toHaveBeenCalledWith(
          newCompanyData,
          mockSession
        );
        expect(mockUpdateWithCompanyId).toHaveBeenCalledWith(
          mockTransaction,
          createdCompany.id,
          mockSession
        );
        expect(result).toEqual({ created: 1, skipped: 0, updated: 0 });
        expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy();
      });

      test('should handle company creation returning null (not dry run)', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: 'Test Company Ltd',
          tradeName: 'Test Company Ltd',
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);
        mockInsertCompany.mockResolvedValue(null); // Simulate company creation returning null

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false // Not dry run
        );

        expect(mockInsertCompany).toHaveBeenCalledWith(
          newCompanyData,
          mockSession
        );
        expect(mockUpdateWithCompanyId).not.toHaveBeenCalled();
        expect(result).toEqual(EMPTY_RESULT);
        expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy(); // Should be marked as processed to avoid retries
      });

      test('should handle company with only tradeName (no corporateName)', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: null, // No corporate name
          tradeName: 'Test Trade Name',
        };

        const createdCompany = {
          id: 'new-company-123',
          ...newCompanyData,
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);
        mockInsertCompany.mockResolvedValue(createdCompany);
        mockUpdateWithCompanyId.mockResolvedValue(true);

        const result = await CompanyProcessor.process(
          mockTransaction,
          processedEntities,
          mockSession,
          false
        );

        expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      });
    });

    describe('error handling', () => {
      test('should handle database errors and track in dry-run', async () => {
        const error = new Error('Database connection failed');
        mockFindByCnpj.mockRejectedValue(error);

        await expect(
          CompanyProcessor.process(
            mockTransaction,
            processedEntities,
            mockSession,
            true,
            mockDryRunStats
          )
        ).rejects.toThrow('Database connection failed');

        expect(mockAddFailedRecord).toHaveBeenCalledWith(
          mockDryRunStats,
          mockTransaction,
          'Database connection failed'
        );
      });

      test('should handle errors without dry-run stats', async () => {
        const error = new Error('Database connection failed');
        mockFindByCnpj.mockRejectedValue(error);

        await expect(
          CompanyProcessor.process(
            mockTransaction,
            processedEntities,
            mockSession,
            false
          )
        ).rejects.toThrow('Database connection failed');
      });

      test('should handle company creation error', async () => {
        const newCompanyData = {
          companyCnpj: '12.345.678/0001-90',
          corporateName: 'Test Company Ltd',
        };

        mockFindByCnpj.mockResolvedValue(null);
        mockFromTransaction.mockReturnValue(newCompanyData);
        mockInsertCompany.mockRejectedValue(new Error('Insert failed'));

        await expect(
          CompanyProcessor.process(
            mockTransaction,
            processedEntities,
            mockSession,
            false
          )
        ).rejects.toThrow('Insert failed');
      });
    });
  });

  describe('findExisting method', () => {
    test('should find existing company by CNPJ', async () => {
      const expectedCompany = {
        id: 'company-123',
        cnpj: '12.345.678/0001-90',
        corporateName: 'Existing Company',
      };

      mockFindByCnpj.mockResolvedValue(expectedCompany);

      const result = await CompanyProcessor.findExisting(
        mockTransaction,
        mockSession
      );

      expect(mockFindByCnpj).toHaveBeenCalledWith(
        '12.345.678/0001-90',
        mockSession
      );
      expect(result).toEqual(expectedCompany);
    });

    test('should return null when no CNPJ provided', async () => {
      const transactionWithoutCnpj = {
        ...mockTransaction,
        companyCnpj: undefined,
      };

      const result = await CompanyProcessor.findExisting(
        transactionWithoutCnpj,
        mockSession
      );

      expect(mockFindByCnpj).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should return null when CNPJ is empty string', async () => {
      const transactionWithEmptyCnpj = { ...mockTransaction, companyCnpj: '' };

      const result = await CompanyProcessor.findExisting(
        transactionWithEmptyCnpj,
        mockSession
      );

      expect(mockFindByCnpj).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should return null when companyCnpj is null', async () => {
      const transactionWithNullCnpj = {
        ...mockTransaction,
        companyCnpj: null,
      };

      const result = await CompanyProcessor.findExisting(
        transactionWithNullCnpj,
        mockSession
      );

      expect(mockFindByCnpj).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should return null when companyCnpj is 0', async () => {
      const transactionWithZeroCnpj = {
        ...mockTransaction,
        companyCnpj: 0,
      };

      const result = await CompanyProcessor.findExisting(
        transactionWithZeroCnpj,
        mockSession
      );

      expect(mockFindByCnpj).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should return null when companyCnpj is false', async () => {
      const transactionWithFalseCnpj = {
        ...mockTransaction,
        companyCnpj: false,
      };

      const result = await CompanyProcessor.findExisting(
        transactionWithFalseCnpj,
        mockSession
      );

      expect(mockFindByCnpj).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should handle repository error in findExisting', async () => {
      const repositoryError = new Error('Repository connection failed');
      mockFindByCnpj.mockRejectedValue(repositoryError);

      await expect(
        CompanyProcessor.findExisting(mockTransaction, mockSession)
      ).rejects.toThrow('Repository connection failed');

      expect(mockFindByCnpj).toHaveBeenCalledWith(
        '12.345.678/0001-90',
        mockSession
      );
    });
  });

  describe('create method', () => {
    test('should create company with session', async () => {
      const companyData = {
        companyCnpj: '12.345.678/0001-90',
        corporateName: 'New Company',
        tradeName: 'New Company',
      };

      const createdCompany = {
        id: 'new-company-123',
        ...companyData,
      };

      mockInsertCompany.mockResolvedValue(createdCompany);

      const result = await CompanyProcessor.create(companyData, mockSession);

      expect(mockInsertCompany).toHaveBeenCalledWith(companyData, mockSession);
      expect(result).toEqual(createdCompany);
    });

    test('should handle create error', async () => {
      const companyData = {
        companyCnpj: '12.345.678/0001-90',
        corporateName: 'New Company',
      };

      mockInsertCompany.mockRejectedValue(new Error('Create failed'));

      await expect(
        CompanyProcessor.create(companyData, mockSession)
      ).rejects.toThrow('Create failed');
    });
  });

  describe('integration scenarios', () => {
    test('should handle complete company processing workflow', async () => {
      const newCompanyData = {
        companyCnpj: '98.765.432/0001-10',
        corporateName: 'Complete Test Company',
        tradeName: 'Complete Test Company',
      };

      const createdCompany = {
        id: 'complete-company-123',
        ...newCompanyData,
      };

      mockFindByCnpj.mockResolvedValue(null);
      mockFromTransaction.mockReturnValue(newCompanyData);
      mockInsertCompany.mockResolvedValue(createdCompany);
      mockUpdateWithCompanyId.mockResolvedValue(true);

      const completeTransaction = {
        ...mockTransaction,
        companyCnpj: '98.765.432/0001-10',
        companyName: 'Complete Test Company',
      };

      const result = await CompanyProcessor.process(
        completeTransaction,
        processedEntities,
        mockSession,
        false
      );

      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.has('98.765.432/0001-10')).toBe(true);
    });

    test('should handle transaction without CNPJ', async () => {
      const transactionWithoutCnpj = {
        ...mockTransaction,
        companyCnpj: null, // or undefined
      };

      const result = await CompanyProcessor.findExisting(
        transactionWithoutCnpj,
        mockSession
      );

      expect(result).toBeNull();
      expect(mockFindByCnpj).not.toHaveBeenCalled();
    });

    test('should track multiple processed entities', () => {
      // This test is synchronous
      const entity1 = { id: '1', cnpj: '11.111.111/0001-11' };
      const entity2 = { id: '2', cnpj: '22.222.222/0001-22' };

      processedEntities.set('11.111.111/0001-11', entity1);
      processedEntities.set('22.222.222/0001-22', entity2);

      expect(processedEntities.size).toBe(2);
      expect(processedEntities.get('11.111.111/0001-11')).toEqual(entity1);
      expect(processedEntities.get('22.222.222/0001-22')).toEqual(entity2);
    });

    test('should handle multiple transactions with same CNPJ efficiently', async () => {
      const existingCompany = {
        id: 'existing-company-123',
        cnpj: '12.345.678/0001-90',
        corporateName: 'Existing Company',
      };

      const transaction1 = {
        ...mockTransaction,
        id: 'transaction-1',
        companyCnpj: '12.345.678/0001-90',
      };

      const transaction2 = {
        ...mockTransaction,
        id: 'transaction-2',
        companyCnpj: '12.345.678/0001-90',
      };

      mockFindByCnpj.mockResolvedValue(existingCompany);
      mockUpdateWithCompanyId.mockResolvedValue(true);

      // Process first transaction
      const result1 = await CompanyProcessor.process(
        transaction1,
        processedEntities,
        mockSession,
        false
      );

      // Process second transaction with same CNPJ
      const result2 = await CompanyProcessor.process(
        transaction2,
        processedEntities,
        mockSession,
        false
      );

      // Both should skip company creation since CNPJ is already processed
      expect(result1).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(result2).toEqual({ created: 0, skipped: 1, updated: 1 });

      // Company lookup should only happen once for the first transaction
      expect(mockFindByCnpj).toHaveBeenCalledTimes(1);
      expect(mockUpdateWithCompanyId).toHaveBeenCalledTimes(2);

      // Both transactions should be marked as processed
      expect(processedEntities.get('12.345.678/0001-90')).toBeTruthy();
    });
  });
});

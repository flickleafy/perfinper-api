/**
 * Unit tests for CompanyProcessor
 * Tests all company processing operations
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { CompanyProcessor } from '../companyProcessor.js';
import { EMPTY_RESULT } from '../types.js';

// Mock dependencies
jest.unstable_mockModule('../../../repository/companyRepository.js', () => ({
  findByCnpj: jest.fn(),
  insert: jest.fn(),
}));

jest.unstable_mockModule('./entityAdapters.js', () => ({
  CompanyAdapter: {
    fromTransaction: jest.fn(),
  },
}));

jest.unstable_mockModule('./transactionUpdater.js', () => ({
  TransactionUpdater: {
    updateWithCompanyId: jest.fn(),
  },
}));

const { findByCnpj, insert: insertCompany } = await import(
  '../../../repository/companyRepository.js'
);
const { CompanyAdapter } = await import('./entityAdapters.js');
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

describe('CompanyProcessor', () => {
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
    test('should handle existing company and update transaction', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '12.345.678/0001-95',
        companyName: 'Test Company',
      };

      const existingCompany = {
        id: 'company123',
        corporateName: 'Test Company Ltd',
        tradeName: 'Test Company',
      };

      findByCnpj.mockResolvedValue(existingCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(true);

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(findByCnpj).toHaveBeenCalledWith(
        '12.345.678/0001-95',
        mockSession
      );
      expect(TransactionUpdater.updateWithCompanyId).toHaveBeenCalledWith(
        transaction,
        'company123',
        mockSession
      );
      expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get('12.345.678/0001-95')).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '✅ Company already exists: Test Company Ltd'
      );
    });

    test('should handle existing company with tradeName when corporateName is missing', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '12.345.678/0001-95',
        companyName: 'Test Company',
      };

      const existingCompany = {
        id: 'company123',
        tradeName: 'Test Company',
      };

      findByCnpj.mockResolvedValue(existingCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(true);

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(console.log).toHaveBeenCalledWith(
        '✅ Company already exists: Test Company'
      );
      expect(result).toEqual({ created: 0, skipped: 1, updated: 1 });
    });

    test('should handle existing company when transaction update fails', async () => {
      const transaction = {
        id: 'transaction123',
        companyCnpj: '12.345.678/0001-95',
        companyName: 'Test Company',
      };

      const existingCompany = {
        id: 'company123',
        corporateName: 'Test Company Ltd',
      };

      findByCnpj.mockResolvedValue(existingCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(false); // Update skipped

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual({ created: 0, skipped: 1, updated: 0 });
      expect(processedEntities.get('12.345.678/0001-95')).toBe(true);
    });

    test('should create new company when none exists', async () => {
      const transaction = {
        id: 'transaction456',
        companyCnpj: '98.765.432/0001-10',
        companyName: 'New Company',
      };

      const newCompanyData = {
        companyName: 'New Company',
        companyCnpj: '98.765.432/0001-10',
        corporateName: 'New Company',
        tradeName: 'New Company',
      };

      const createdCompany = {
        id: 'company456',
        ...newCompanyData,
      };

      findByCnpj.mockResolvedValue(null);
      CompanyAdapter.fromTransaction.mockReturnValue(newCompanyData);
      insertCompany.mockResolvedValue(createdCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(true);

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(findByCnpj).toHaveBeenCalledWith(
        '98.765.432/0001-10',
        mockSession
      );
      expect(CompanyAdapter.fromTransaction).toHaveBeenCalledWith(transaction);
      expect(insertCompany).toHaveBeenCalledWith(newCompanyData, mockSession);
      expect(TransactionUpdater.updateWithCompanyId).toHaveBeenCalledWith(
        transaction,
        'company456',
        mockSession
      );
      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('98.765.432/0001-10')).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '🆕 Created company: New Company'
      );
    });

    test('should create company using tradeName when corporateName is missing', async () => {
      const transaction = {
        id: 'transaction456',
        companyCnpj: '98.765.432/0001-10',
        companyName: 'New Company',
      };

      const newCompanyData = {
        tradeName: 'New Company',
        companyName: 'New Company',
      };

      const createdCompany = {
        id: 'company456',
        ...newCompanyData,
      };

      findByCnpj.mockResolvedValue(null);
      CompanyAdapter.fromTransaction.mockReturnValue(newCompanyData);
      insertCompany.mockResolvedValue(createdCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(true);

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(console.log).toHaveBeenCalledWith(
        '🆕 Created company: New Company'
      );
      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
    });

    test('should handle case when CompanyAdapter returns null', async () => {
      const transaction = {
        id: 'transaction789',
        companyCnpj: '11.111.111/0001-11',
        companyName: 'Invalid Company',
      };

      findByCnpj.mockResolvedValue(null);
      CompanyAdapter.fromTransaction.mockReturnValue(null); // Invalid company data

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      expect(result).toEqual(EMPTY_RESULT);
      expect(insertCompany).not.toHaveBeenCalled();
      expect(TransactionUpdater.updateWithCompanyId).not.toHaveBeenCalled();
      expect(processedEntities.has('11.111.111/0001-11')).toBe(false);
    });

    test('should handle errors during processing', async () => {
      const transaction = {
        id: 'transaction999',
        companyCnpj: '99.999.999/0001-99',
        companyName: 'Error Company',
      };

      const error = new Error('Database connection failed');
      findByCnpj.mockRejectedValue(error);

      await expect(
        CompanyProcessor.process(transaction, processedEntities, mockSession)
      ).rejects.toThrow('Database connection failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error processing company transaction:',
        'Database connection failed'
      );
    });

    test('should handle errors during company creation', async () => {
      const transaction = {
        id: 'transaction888',
        companyCnpj: '88.888.888/0001-88',
        companyName: 'Error Company',
      };

      const newCompanyData = {
        companyName: 'Error Company',
        companyCnpj: '88.888.888/0001-88',
      };

      findByCnpj.mockResolvedValue(null);
      CompanyAdapter.fromTransaction.mockReturnValue(newCompanyData);
      insertCompany.mockRejectedValue(new Error('Insert failed'));

      await expect(
        CompanyProcessor.process(transaction, processedEntities, mockSession)
      ).rejects.toThrow('Insert failed');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Error processing company transaction:',
        'Insert failed'
      );
    });
  });

  describe('findExisting', () => {
    test('should find company by CNPJ when companyCnpj exists', async () => {
      const transaction = {
        companyCnpj: '12.345.678/0001-95',
        companyName: 'Test Company',
      };

      const existingCompany = {
        id: 'company123',
        companyCnpj: '12.345.678/0001-95',
      };

      findByCnpj.mockResolvedValue(existingCompany);

      const result = await CompanyProcessor.findExisting(
        transaction,
        mockSession
      );

      expect(findByCnpj).toHaveBeenCalledWith(
        '12.345.678/0001-95',
        mockSession
      );
      expect(result).toBe(existingCompany);
    });

    test('should return null when companyCnpj is missing', async () => {
      const transaction = {
        companyName: 'Test Company',
      };

      const result = await CompanyProcessor.findExisting(
        transaction,
        mockSession
      );

      expect(findByCnpj).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should return null when companyCnpj is falsy', async () => {
      const falsyValues = [null, undefined, '', 0, false];

      for (const falsyValue of falsyValues) {
        const transaction = {
          companyCnpj: falsyValue,
          companyName: 'Test Company',
        };

        const result = await CompanyProcessor.findExisting(
          transaction,
          mockSession
        );

        expect(result).toBeNull();
      }

      expect(findByCnpj).not.toHaveBeenCalled();
    });

    test('should handle repository errors', async () => {
      const transaction = {
        companyCnpj: '12.345.678/0001-95',
      };

      findByCnpj.mockRejectedValue(new Error('Database error'));

      await expect(
        CompanyProcessor.findExisting(transaction, mockSession)
      ).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    test('should create company with session', async () => {
      const companyData = {
        companyName: 'New Company',
        companyCnpj: '12.345.678/0001-95',
        corporateName: 'New Company Ltd',
      };

      const createdCompany = {
        id: 'company123',
        ...companyData,
      };

      insertCompany.mockResolvedValue(createdCompany);

      const result = await CompanyProcessor.create(companyData, mockSession);

      expect(insertCompany).toHaveBeenCalledWith(companyData, mockSession);
      expect(result).toBe(createdCompany);
    });

    test('should handle creation errors', async () => {
      const companyData = {
        companyName: 'Error Company',
      };

      insertCompany.mockRejectedValue(new Error('Creation failed'));

      await expect(
        CompanyProcessor.create(companyData, mockSession)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete company processing workflow', async () => {
      const transaction = {
        id: 'transaction-integration',
        companyCnpj: '11.222.333/0001-44',
        companyName: 'Integration Test Company',
        companySellerName: 'John Seller',
      };

      const companyData = {
        companyName: 'Integration Test Company',
        companyCnpj: '11.222.333/0001-44',
        corporateName: 'Integration Test Company',
        companySellerName: 'John Seller',
      };

      const createdCompany = {
        id: 'company-integration',
        ...companyData,
      };

      // Mock successful flow
      findByCnpj.mockResolvedValue(null);
      CompanyAdapter.fromTransaction.mockReturnValue(companyData);
      insertCompany.mockResolvedValue(createdCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(true);

      const result = await CompanyProcessor.process(
        transaction,
        processedEntities,
        mockSession
      );

      // Verify complete workflow
      expect(findByCnpj).toHaveBeenCalledWith(
        '11.222.333/0001-44',
        mockSession
      );
      expect(CompanyAdapter.fromTransaction).toHaveBeenCalledWith(transaction);
      expect(insertCompany).toHaveBeenCalledWith(companyData, mockSession);
      expect(TransactionUpdater.updateWithCompanyId).toHaveBeenCalledWith(
        transaction,
        'company-integration',
        mockSession
      );

      expect(result).toEqual({ created: 1, skipped: 0, updated: 1 });
      expect(processedEntities.get('11.222.333/0001-44')).toBe(true);
    });

    test('should handle multiple transactions with same CNPJ', async () => {
      const baseCnpj = '22.333.444/0001-55';
      const processedEntities = new Map();

      const transaction1 = {
        id: 'transaction1',
        companyCnpj: baseCnpj,
        companyName: 'Same Company',
      };

      const transaction2 = {
        id: 'transaction2',
        companyCnpj: baseCnpj,
        companyName: 'Same Company',
      };

      const existingCompany = {
        id: 'company-same',
        corporateName: 'Same Company',
        companyCnpj: baseCnpj,
      };

      findByCnpj.mockResolvedValue(existingCompany);
      TransactionUpdater.updateWithCompanyId.mockResolvedValue(true);

      // Process first transaction
      const result1 = await CompanyProcessor.process(
        transaction1,
        processedEntities,
        mockSession
      );

      // Process second transaction
      const result2 = await CompanyProcessor.process(
        transaction2,
        processedEntities,
        mockSession
      );

      expect(result1).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(result2).toEqual({ created: 0, skipped: 1, updated: 1 });
      expect(processedEntities.get(baseCnpj)).toBe(true);
      expect(findByCnpj).toHaveBeenCalledTimes(2);
    });
  });
});

/**
 * Tests for Migration Service Orchestrator (index.js)
 * Tests the main migration coordinator, session management, and helper functions
 * Covers both unit tests for individual functions and integration tests for the complete workflow
 */

import mongoose from 'mongoose';

// Mock external dependencies before importing the module under test
jest.unstable_mockModule(
  '../../../repository/transactionRepository.js',
  () => ({
    findAllWithCompanyCnpj: jest.fn(),
  })
);

jest.unstable_mockModule('../documentValidator.js', () => ({
  DocumentValidator: {
    validateDocument: jest.fn(),
    isAnonymizedCPF: jest.fn(),
  },
}));

jest.unstable_mockModule('../companyProcessor.js', () => ({
  CompanyProcessor: {
    process: jest.fn(),
  },
}));

jest.unstable_mockModule('../personProcessor.js', () => ({
  PersonProcessor: {
    process: jest.fn(),
  },
}));

jest.unstable_mockModule('../anonymousPersonProcessor.js', () => ({
  AnonymousPersonProcessor: {
    process: jest.fn(),
  },
}));

jest.unstable_mockModule('../types.js', () => ({
  DOCUMENT_TYPES: {
    CNPJ: 'CNPJ',
    CPF: 'CPF',
    ANONYMOUS_CPF: 'ANONYMOUS_CPF',
  },
}));

// Mock mongoose
jest.unstable_mockModule('mongoose', () => ({
  default: {
    startSession: jest.fn(),
  },
}));

// Import the modules after mocking
const { findAllWithCompanyCnpj } = await import(
  '../../../repository/transactionRepository.js'
);
const { DocumentValidator } = await import('../documentValidator.js');
const { CompanyProcessor } = await import('../companyProcessor.js');
const { PersonProcessor } = await import('../personProcessor.js');
const { AnonymousPersonProcessor } = await import(
  '../anonymousPersonProcessor.js'
);
const { DOCUMENT_TYPES } = await import('../types.js');
const { migrateCompanyDataToCompanyCollection } = await import('../index.js');

describe('Migration Service Orchestrator', () => {
  // Mock session object
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock session
    mockSession = {
      withTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    // Mock mongoose.startSession
    mongoose.startSession.mockResolvedValue(mockSession);
  });

  describe('migrateCompanyDataToCompanyCollection', () => {
    it('should handle empty transactions list', async () => {
      // Arrange
      findAllWithCompanyCnpj.mockResolvedValue([]);

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result).toEqual({
        success: true,
        transactionsAnalyzed: 0,
        companiesCreated: 0,
        companiesUpdated: 0,
        personsCreated: 0,
        personsUpdated: 0,
        anonymousPersonsCreated: 0,
        anonymousPersonsUpdated: 0,
        uniqueEntitiesProcessed: 0,
      });

      expect(findAllWithCompanyCnpj).toHaveBeenCalledTimes(1);
      expect(mongoose.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should process transactions with CNPJ successfully', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
        {
          id: 'txn2',
          companyCnpj: '98.765.432/0001-10',
          companyName: 'Company B',
          amount: 2000,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      // Mock session.withTransaction to call the callback
      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      // Mock DocumentValidator
      DocumentValidator.validateDocument
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CNPJ })
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CNPJ });

      // Mock CompanyProcessor
      CompanyProcessor.process
        .mockResolvedValueOnce({ created: 1, updated: 0 })
        .mockResolvedValueOnce({ created: 0, updated: 1 });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionsAnalyzed).toBe(2);
      expect(result.companiesCreated).toBe(1);
      expect(result.companiesUpdated).toBe(1);
      expect(result.personsCreated).toBe(0);
      expect(result.personsUpdated).toBe(0);
      expect(result.uniqueEntitiesProcessed).toBe(2);

      expect(CompanyProcessor.process).toHaveBeenCalledTimes(2);
      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should process transactions with CPF successfully', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '123.456.789-01',
          companyName: 'Person A',
          amount: 500,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      DocumentValidator.validateDocument.mockReturnValue({
        isValid: true,
        type: DOCUMENT_TYPES.CPF,
      });

      PersonProcessor.process.mockResolvedValue({ created: 1, updated: 0 });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.personsCreated).toBe(1);
      expect(result.personsUpdated).toBe(0);
      expect(result.companiesCreated).toBe(0);
      expect(PersonProcessor.process).toHaveBeenCalledTimes(1);
    });

    it('should process transactions with anonymized CPF successfully', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '***.***.***-**',
          companyName: 'Anonymous Person',
          amount: 300,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      DocumentValidator.validateDocument.mockReturnValue({ isValid: false });
      DocumentValidator.isAnonymizedCPF.mockReturnValue(true);

      AnonymousPersonProcessor.process.mockResolvedValue({
        created: 1,
        updated: 0,
      });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.anonymousPersonsCreated).toBe(1);
      expect(result.anonymousPersonsUpdated).toBe(0);
      expect(DocumentValidator.isAnonymizedCPF).toHaveBeenCalledWith(
        '***.***.***-**'
      );
      expect(AnonymousPersonProcessor.process).toHaveBeenCalledTimes(1);
    });

    it('should skip transactions without company data', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '',
          amount: 100,
        },
        {
          id: 'txn2',
          companyCnpj: null,
          amount: 200,
        },
        {
          id: 'txn3',
          companyCnpj: '   ',
          amount: 300,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.transactionsAnalyzed).toBe(3);
      expect(result.uniqueEntitiesProcessed).toBe(0);
      expect(result.companiesCreated).toBe(0);
      expect(result.personsCreated).toBe(0);
      expect(result.anonymousPersonsCreated).toBe(0);

      // Should not call any processors
      expect(CompanyProcessor.process).not.toHaveBeenCalled();
      expect(PersonProcessor.process).not.toHaveBeenCalled();
      expect(AnonymousPersonProcessor.process).not.toHaveBeenCalled();
    });

    it('should skip duplicate entities in the same migration', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
        {
          id: 'txn2',
          companyCnpj: '12.345.678/0001-90', // Same CNPJ
          companyName: 'Company A',
          amount: 2000,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      DocumentValidator.validateDocument.mockReturnValue({
        isValid: true,
        type: DOCUMENT_TYPES.CNPJ,
      });

      CompanyProcessor.process.mockResolvedValue({ created: 1, updated: 0 });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.transactionsAnalyzed).toBe(2);
      expect(result.uniqueEntitiesProcessed).toBe(1); // Only one unique entity
      expect(result.companiesCreated).toBe(1);
      expect(CompanyProcessor.process).toHaveBeenCalledTimes(1); // Called only once
    });

    it('should handle invalid documents that are not anonymized CPF', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: 'invalid-document',
          companyName: 'Invalid Company',
          amount: 100,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      DocumentValidator.validateDocument.mockReturnValue({ isValid: false });
      DocumentValidator.isAnonymizedCPF.mockReturnValue(false);

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.transactionsAnalyzed).toBe(1);
      expect(result.uniqueEntitiesProcessed).toBe(0);
      expect(result.companiesCreated).toBe(0);
      expect(result.personsCreated).toBe(0);
      expect(result.anonymousPersonsCreated).toBe(0);

      expect(DocumentValidator.isAnonymizedCPF).toHaveBeenCalledWith(
        'invalid-document'
      );
      expect(CompanyProcessor.process).not.toHaveBeenCalled();
      expect(PersonProcessor.process).not.toHaveBeenCalled();
      expect(AnonymousPersonProcessor.process).not.toHaveBeenCalled();
    });

    it('should handle processing errors and rollback transaction', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      const processingError = new Error('Processing failed');
      mockSession.withTransaction.mockRejectedValue(processingError);

      DocumentValidator.validateDocument.mockReturnValue({
        isValid: true,
        type: DOCUMENT_TYPES.CNPJ,
      });

      CompanyProcessor.process.mockRejectedValue(processingError);

      // Act & Assert
      await expect(migrateCompanyDataToCompanyCollection()).rejects.toThrow(
        'Processing failed'
      );

      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      findAllWithCompanyCnpj.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(migrateCompanyDataToCompanyCollection()).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should process mixed document types in one migration', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
        {
          id: 'txn2',
          companyCnpj: '123.456.789-01',
          companyName: 'Person A',
          amount: 500,
        },
        {
          id: 'txn3',
          companyCnpj: '***.***.***-**',
          companyName: 'Anonymous Person',
          amount: 300,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      // Mock different document validations
      DocumentValidator.validateDocument
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CNPJ })
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CPF })
        .mockReturnValueOnce({ isValid: false });

      DocumentValidator.isAnonymizedCPF.mockReturnValue(true);

      // Mock processor responses
      CompanyProcessor.process.mockResolvedValue({ created: 1, updated: 0 });
      PersonProcessor.process.mockResolvedValue({ created: 1, updated: 0 });
      AnonymousPersonProcessor.process.mockResolvedValue({
        created: 1,
        updated: 0,
      });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result.transactionsAnalyzed).toBe(3);
      expect(result.companiesCreated).toBe(1);
      expect(result.personsCreated).toBe(1);
      expect(result.anonymousPersonsCreated).toBe(1);
      expect(result.uniqueEntitiesProcessed).toBe(3);

      expect(CompanyProcessor.process).toHaveBeenCalledTimes(1);
      expect(PersonProcessor.process).toHaveBeenCalledTimes(1);
      expect(AnonymousPersonProcessor.process).toHaveBeenCalledTimes(1);
    });

    it('should log appropriate messages during migration', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      DocumentValidator.validateDocument.mockReturnValue({
        isValid: true,
        type: DOCUMENT_TYPES.CNPJ,
      });

      CompanyProcessor.process.mockResolvedValue({ created: 1, updated: 0 });

      // Act
      await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '🏢 Starting company and person data migration from transactions with CNPJ/CPF...'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📊 Found 1 transactions with CNPJ/CPF to analyze'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '🎉 Company and person data migration completed!'
      );

      consoleSpy.mockRestore();
    });

    it('should log when no transactions are found', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      findAllWithCompanyCnpj.mockResolvedValue([]);

      // Act
      await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'ℹ️ No transactions found. Migration completed.'
      );

      consoleSpy.mockRestore();
    });

    it('should log errors and rethrow them', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      findAllWithCompanyCnpj.mockRejectedValue(error);

      // Act & Assert
      await expect(migrateCompanyDataToCompanyCollection()).rejects.toThrow(
        'Test error'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '💥 Error during company and person data migration:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Session Management', () => {
    it('should properly start and end MongoDB session', async () => {
      // Arrange
      findAllWithCompanyCnpj.mockResolvedValue([]);

      // Act
      await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(mongoose.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should end session even if migration fails', async () => {
      // Arrange
      const error = new Error('Migration failed');
      findAllWithCompanyCnpj.mockRejectedValue(error);

      // Act & Assert
      await expect(migrateCompanyDataToCompanyCollection()).rejects.toThrow(
        'Migration failed'
      );

      expect(mongoose.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should use session in withTransaction callback', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      // Mock withTransaction to capture the callback
      let sessionCallback;
      mockSession.withTransaction.mockImplementation(async (callback) => {
        sessionCallback = callback;
        return await callback();
      });

      DocumentValidator.validateDocument.mockReturnValue({
        isValid: true,
        type: DOCUMENT_TYPES.CNPJ,
      });

      CompanyProcessor.process.mockResolvedValue({ created: 1, updated: 0 });

      // Act
      await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(sessionCallback).toBeDefined();
      expect(typeof sessionCallback).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex migration scenario with all document types', async () => {
      // Arrange
      const mockTransactions = [
        // CNPJ transactions
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
        {
          id: 'txn2',
          companyCnpj: '12.345.678/0001-90', // Duplicate CNPJ
          companyName: 'Company A',
          amount: 1500,
        },
        // CPF transactions
        {
          id: 'txn3',
          companyCnpj: '123.456.789-01',
          companyName: 'Person A',
          amount: 500,
        },
        {
          id: 'txn4',
          companyCnpj: '987.654.321-00',
          companyName: 'Person B',
          amount: 750,
        },
        // Anonymous CPF transactions
        {
          id: 'txn5',
          companyCnpj: '***.***.***-**',
          companyName: 'Anonymous Person',
          amount: 300,
        },
        // Invalid document
        {
          id: 'txn6',
          companyCnpj: 'invalid-doc',
          companyName: 'Invalid Company',
          amount: 100,
        },
        // Empty company data
        {
          id: 'txn7',
          companyCnpj: '',
          amount: 50,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      // Mock document validation responses
      DocumentValidator.validateDocument
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CNPJ }) // txn1
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CPF }) // txn3
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CPF }) // txn4
        .mockReturnValueOnce({ isValid: false }) // txn5 (anonymous)
        .mockReturnValueOnce({ isValid: false }); // txn6 (invalid)

      DocumentValidator.isAnonymizedCPF
        .mockReturnValueOnce(true) // txn5
        .mockReturnValueOnce(false); // txn6

      // Mock processor responses
      CompanyProcessor.process.mockResolvedValue({ created: 1, updated: 0 });
      PersonProcessor.process
        .mockResolvedValueOnce({ created: 1, updated: 0 }) // Person A
        .mockResolvedValueOnce({ created: 1, updated: 0 }); // Person B
      AnonymousPersonProcessor.process.mockResolvedValue({
        created: 1,
        updated: 0,
      });

      // Act
      const result = await migrateCompanyDataToCompanyCollection();

      // Assert
      expect(result).toEqual({
        success: true,
        transactionsAnalyzed: 7,
        companiesCreated: 1,
        companiesUpdated: 0,
        personsCreated: 2,
        personsUpdated: 0,
        anonymousPersonsCreated: 1,
        anonymousPersonsUpdated: 0,
        uniqueEntitiesProcessed: 4, // Company A, Person A, Person B, Anonymous Person
      });

      // Verify processor calls
      expect(CompanyProcessor.process).toHaveBeenCalledTimes(1);
      expect(PersonProcessor.process).toHaveBeenCalledTimes(2);
      expect(AnonymousPersonProcessor.process).toHaveBeenCalledTimes(1);
    });

    it('should maintain transaction integrity on processor failure', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'txn1',
          companyCnpj: '12.345.678/0001-90',
          companyName: 'Company A',
          amount: 1000,
        },
        {
          id: 'txn2',
          companyCnpj: '123.456.789-01',
          companyName: 'Person A',
          amount: 500,
        },
      ];

      findAllWithCompanyCnpj.mockResolvedValue(mockTransactions);

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      DocumentValidator.validateDocument
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CNPJ })
        .mockReturnValueOnce({ isValid: true, type: DOCUMENT_TYPES.CPF });

      // First processor succeeds, second fails
      CompanyProcessor.process.mockResolvedValue({ created: 1, updated: 0 });
      PersonProcessor.process.mockRejectedValue(
        new Error('Person processing failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(migrateCompanyDataToCompanyCollection()).rejects.toThrow(
        'Person processing failed'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error processing transaction txn2:',
        'Person processing failed'
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

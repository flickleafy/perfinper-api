import mongoose from 'mongoose';
import TransactionModel from '../src/models/TransactionModel.js';
import FiscalBookModel from '../src/models/FiscalBookModel.js';
import * as fiscalBookRepository from '../src/repository/fiscalBookRepository.js';
import * as transactionRepository from '../src/repository/transactionRepository.js';
import * as fiscalBookService from '../src/services/fiscalBookService.js';
import validator from '../src/infrastructure/validators/fiscalBookValidator.js';

// Mock mongoose
jest.mock('mongoose');

describe('Fiscal Book Tests', () => {
  let mockSession;

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    mongoose.startSession.mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fiscal Book Repository', () => {
    test('findAll should return all fiscal books with filter', async () => {
      // Mock FiscalBookModel.find
      const mockFind = jest.fn();
      const mockLimit = jest.fn();
      const mockSkip = jest.fn();
      const mockSort = jest.fn();
      const mockSession = jest.fn();
      const mockExec = jest
        .fn()
        .mockResolvedValue([{ id: '1', bookName: 'Test Book' }]);

      mockFind.mockReturnValue({
        limit: mockLimit,
        skip: mockSkip,
        sort: mockSort,
        session: mockSession,
        exec: mockExec,
      });

      mockLimit.mockReturnValue({
        skip: mockSkip,
        sort: mockSort,
        session: mockSession,
        exec: mockExec,
      });

      mockSkip.mockReturnValue({
        sort: mockSort,
        session: mockSession,
        exec: mockExec,
      });

      mockSort.mockReturnValue({
        session: mockSession,
        exec: mockExec,
      });

      mockSession.mockReturnValue({
        exec: mockExec,
      });

      FiscalBookModel.find = mockFind;

      const filter = { bookType: 'Entrada' };
      const options = { limit: 10, skip: 0, sort: { createdAt: -1 } };
      const result = await fiscalBookRepository.findAll(filter, options);

      expect(mockFind).toHaveBeenCalledWith(filter);
      expect(mockLimit).toHaveBeenCalledWith(options.limit);
      expect(mockSkip).toHaveBeenCalledWith(options.skip);
      expect(mockSort).toHaveBeenCalledWith(options.sort);
      expect(result).toEqual([{ id: '1', bookName: 'Test Book' }]);
    });

    test('findById should return a fiscal book by ID', async () => {
      const mockFiscalBook = { id: '1', bookName: 'Test Book' };
      FiscalBookModel.findById = jest.fn().mockResolvedValue(mockFiscalBook);

      const result = await fiscalBookRepository.findById('1');

      expect(FiscalBookModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockFiscalBook);
    });

    test('closeBook should update status to Fechado', async () => {
      const mockUpdatedBook = {
        id: '1',
        bookName: 'Test Book',
        status: 'Fechado',
        closedAt: expect.any(Date),
      };

      FiscalBookModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedBook);

      const result = await fiscalBookRepository.closeBook('1');

      expect(FiscalBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        {
          status: 'Fechado',
          closedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        { new: true }
      );

      expect(result).toEqual(mockUpdatedBook);
    });
  });

  describe('Fiscal Book Validator', () => {
    test('validateFiscalBookData should validate required fields', () => {
      const validData = {
        bookName: 'Test Book',
        bookType: 'Entrada',
        bookPeriod: '2023-01',
        status: 'Aberto',
      };

      const invalidData = {
        bookName: '',
        bookType: 'InvalidType',
        bookPeriod: 'invalid-format',
      };

      expect(validator.validateFiscalBookData(validData).isValid).toBe(true);
      expect(validator.validateFiscalBookData(invalidData).isValid).toBe(false);

      const invalidResult = validator.validateFiscalBookData(invalidData);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('validateTransactionFiscalBookRelationship should validate relationship', () => {
      const fiscalBook = {
        id: '1',
        bookName: 'Test Book',
        bookPeriod: '2023-01',
        status: 'Aberto',
        companyId: mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
      };

      const validTransaction = {
        id: '2',
        transactionPeriod: '2023-01',
        companyId: mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
      };

      const invalidTransaction = {
        id: '3',
        transactionPeriod: '2023-02',
        companyId: mongoose.Types.ObjectId('60d0fe4f5311236168a109cb'),
      };

      const validResult = validator.validateTransactionFiscalBookRelationship(
        fiscalBook,
        validTransaction
      );

      const invalidResult = validator.validateTransactionFiscalBookRelationship(
        fiscalBook,
        invalidTransaction
      );

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Fiscal Book Service', () => {
    test('createFiscalBook should validate and create a fiscal book', async () => {
      const mockFiscalBook = {
        bookName: 'Test Book',
        bookType: 'Entrada',
        bookPeriod: '2023-01',
        status: 'Aberto',
      };

      const validateSpy = jest
        .spyOn(validator, 'validateFiscalBookData')
        .mockReturnValue({ isValid: true, errors: [] });
      const insertSpy = jest
        .spyOn(fiscalBookRepository, 'insert')
        .mockResolvedValue({
          ...mockFiscalBook,
          id: '1',
        });

      const result = await fiscalBookService.createFiscalBook(mockFiscalBook);

      expect(validateSpy).toHaveBeenCalledWith(mockFiscalBook);
      expect(insertSpy).toHaveBeenCalledWith(mockFiscalBook);
      expect(result).toEqual({ ...mockFiscalBook, id: '1' });
    });

    test('addTransactionToFiscalBook should validate and update transaction', async () => {
      const mockBook = {
        id: '1',
        bookName: 'Test Book',
        bookPeriod: '2023-01',
        status: 'Aberto',
      };

      const mockTransaction = {
        id: '2',
        transactionPeriod: '2023-01',
      };

      const validateSpy = jest
        .spyOn(validator, 'validateTransactionFiscalBookRelationship')
        .mockReturnValue({ isValid: true, errors: [] });

      const findBookSpy = jest
        .spyOn(fiscalBookRepository, 'findById')
        .mockResolvedValue(mockBook);

      const findTransactionSpy = jest
        .spyOn(transactionRepository, 'findById')
        .mockResolvedValue(mockTransaction);

      const updateTransactionSpy = jest
        .spyOn(transactionRepository, 'updateById')
        .mockResolvedValue({ ...mockTransaction, fiscalBookId: '1' });

      const result = await fiscalBookService.addTransactionToFiscalBook(
        '1',
        '2'
      );

      expect(findBookSpy).toHaveBeenCalledWith('1', expect.anything());
      expect(findTransactionSpy).toHaveBeenCalledWith('2', expect.anything());
      expect(validateSpy).toHaveBeenCalledWith(mockBook, mockTransaction);
      expect(updateTransactionSpy).toHaveBeenCalledWith(
        '2',
        { fiscalBookId: '1' },
        expect.anything()
      );
      expect(result).toEqual({ ...mockTransaction, fiscalBookId: '1' });
    });
  });
});

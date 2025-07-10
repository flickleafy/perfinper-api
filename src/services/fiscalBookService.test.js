import { jest } from '@jest/globals';

const fiscalBookRepository = {
  insert: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  findBookTransactions: jest.fn(),
  findByType: jest.fn(),
  findByPeriod: jest.fn(),
  findByStatus: jest.fn(),
  findByCompany: jest.fn(),
  closeBook: jest.fn(),
  reopenBook: jest.fn(),
  getStatistics: jest.fn(),
};

const transactionRepository = {
  findById: jest.fn(),
  updateById: jest.fn(),
};

const validator = {
  validateFiscalBookData: jest.fn(),
  validateTransactionFiscalBookRelationship: jest.fn(),
};

const startSession = jest.fn();

const TransactionModel = { modelName: 'Transaction' };

jest.unstable_mockModule('../repository/fiscalBookRepository.js', () => ({
  ...fiscalBookRepository,
}));

jest.unstable_mockModule('../repository/transactionRepository.js', () => ({
  ...transactionRepository,
}));

jest.unstable_mockModule('../infrastructure/validators/fiscalBookValidator.js', () => ({
  default: validator,
}));

jest.unstable_mockModule('mongoose', () => ({
  default: { startSession },
}));

jest.unstable_mockModule('../models/TransactionModel.js', () => ({
  default: TransactionModel,
}));

const service = await import('./fiscalBookService.js');
const {
  createFiscalBook,
  getAllFiscalBooks,
  getFiscalBookById,
  updateFiscalBook,
  deleteFiscalBook,
  getFiscalBooksByType,
  getFiscalBooksByPeriod,
  getFiscalBooksByStatus,
  getFiscalBooksByCompany,
  closeFiscalBook,
  reopenFiscalBook,
  getFiscalBookStatistics,
  getFiscalBookTransactions,
  addTransactionToFiscalBook,
  removeTransactionFromFiscalBook,
  bulkAddTransactionsToFiscalBook,
} = service;

describe('fiscalBookService', () => {
  let session;

  beforeEach(() => {
    jest.clearAllMocks();
    session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);
  });

  test('createFiscalBook validates and inserts', async () => {
    validator.validateFiscalBookData.mockReturnValue({
      isValid: true,
      errors: [],
    });
    fiscalBookRepository.insert.mockResolvedValue({ id: 'fb1' });

    const result = await createFiscalBook({ bookName: 'Book' });

    expect(validator.validateFiscalBookData).toHaveBeenCalledWith({
      bookName: 'Book',
    });
    expect(fiscalBookRepository.insert).toHaveBeenCalledWith({
      bookName: 'Book',
    });
    expect(result).toEqual({ id: 'fb1' });
  });

  test('createFiscalBook rejects invalid data', async () => {
    validator.validateFiscalBookData.mockReturnValue({
      isValid: false,
      errors: ['missing'],
    });

    await expect(createFiscalBook({ bookName: '' })).rejects.toThrow(
      'Invalid fiscal book data: missing'
    );

    expect(fiscalBookRepository.insert).not.toHaveBeenCalled();
  });

  test('getAllFiscalBooks passes filter and options', async () => {
    fiscalBookRepository.findAll.mockResolvedValue([{ id: 'fb1' }]);

    const result = await getAllFiscalBooks({ status: 'open' }, { limit: 1 });

    expect(fiscalBookRepository.findAll).toHaveBeenCalledWith(
      { status: 'open' },
      { limit: 1 }
    );
    expect(result).toEqual([{ id: 'fb1' }]);
  });

  test('getFiscalBookById returns book', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });

    await expect(getFiscalBookById('fb1')).resolves.toEqual({ id: 'fb1' });
  });

  test('getFiscalBookById throws when missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);

    await expect(getFiscalBookById('fb1')).rejects.toThrow(
      'Fiscal book not found'
    );
  });

  test('updateFiscalBook returns updated book', async () => {
    fiscalBookRepository.updateById.mockResolvedValue({ id: 'fb1' });

    await expect(updateFiscalBook('fb1', { status: 'closed' })).resolves.toEqual(
      { id: 'fb1' }
    );
  });

  test('updateFiscalBook throws when missing', async () => {
    fiscalBookRepository.updateById.mockResolvedValue(null);

    await expect(updateFiscalBook('fb1', {})).rejects.toThrow(
      'Fiscal book not found'
    );
  });

  test('deleteFiscalBook rejects when transactions exist', async () => {
    fiscalBookRepository.findBookTransactions.mockResolvedValue([{ id: 't1' }]);

    await expect(deleteFiscalBook('fb1')).rejects.toThrow(
      'Cannot delete fiscal book with associated transactions'
    );

    expect(fiscalBookRepository.deleteById).not.toHaveBeenCalled();
  });

  test('deleteFiscalBook throws when missing', async () => {
    fiscalBookRepository.findBookTransactions.mockResolvedValue([]);
    fiscalBookRepository.deleteById.mockResolvedValue(null);

    await expect(deleteFiscalBook('fb1')).rejects.toThrow(
      'Fiscal book not found'
    );
  });

  test('deleteFiscalBook deletes book', async () => {
    fiscalBookRepository.findBookTransactions.mockResolvedValue([]);
    fiscalBookRepository.deleteById.mockResolvedValue({ id: 'fb1' });

    await expect(deleteFiscalBook('fb1')).resolves.toEqual({ id: 'fb1' });
  });

  describe.each([
    ['getFiscalBooksByType', getFiscalBooksByType, fiscalBookRepository.findByType, 'TypeA'],
    ['getFiscalBooksByPeriod', getFiscalBooksByPeriod, fiscalBookRepository.findByPeriod, '2024-01'],
    ['getFiscalBooksByStatus', getFiscalBooksByStatus, fiscalBookRepository.findByStatus, 'Open'],
    ['getFiscalBooksByCompany', getFiscalBooksByCompany, fiscalBookRepository.findByCompany, 'c1'],
  ])('%s', (label, handler, repoFn, value) => {
    test('returns list', async () => {
      repoFn.mockResolvedValue([{ id: 'fb1' }]);

      const result = await handler(value);

      expect(repoFn).toHaveBeenCalledWith(value);
      expect(result).toEqual([{ id: 'fb1' }]);
    });
  });

  test('closeFiscalBook closes book', async () => {
    fiscalBookRepository.closeBook.mockResolvedValue({ id: 'fb1' });

    await expect(closeFiscalBook('fb1')).resolves.toEqual({ id: 'fb1' });
  });

  test('closeFiscalBook throws when missing', async () => {
    fiscalBookRepository.closeBook.mockResolvedValue(null);

    await expect(closeFiscalBook('fb1')).rejects.toThrow('Fiscal book not found');
  });

  test('reopenFiscalBook reopens book', async () => {
    fiscalBookRepository.reopenBook.mockResolvedValue({ id: 'fb1' });

    await expect(reopenFiscalBook('fb1')).resolves.toEqual({ id: 'fb1' });
  });

  test('reopenFiscalBook throws when missing', async () => {
    fiscalBookRepository.reopenBook.mockResolvedValue(null);

    await expect(reopenFiscalBook('fb1')).rejects.toThrow('Fiscal book not found');
  });

  test('getFiscalBookStatistics returns stats', async () => {
    fiscalBookRepository.getStatistics.mockResolvedValue({ total: 2 });

    await expect(getFiscalBookStatistics()).resolves.toEqual({ total: 2 });
  });

  test('getFiscalBookTransactions returns transactions', async () => {
    fiscalBookRepository.findBookTransactions.mockResolvedValue([{ id: 't1' }]);

    const result = await getFiscalBookTransactions('fb1');

    expect(fiscalBookRepository.findBookTransactions).toHaveBeenCalledWith(
      'fb1',
      TransactionModel
    );
    expect(result).toEqual([{ id: 't1' }]);
  });

  test('addTransactionToFiscalBook updates transaction', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.findById.mockResolvedValue({ id: 't1' });
    validator.validateTransactionFiscalBookRelationship.mockReturnValue({
      isValid: true,
      errors: [],
    });
    transactionRepository.updateById.mockResolvedValue({ id: 't1', fiscalBookId: 'fb1' });

    const result = await addTransactionToFiscalBook('fb1', 't1');

    expect(session.startTransaction).toHaveBeenCalled();
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 't1', fiscalBookId: 'fb1' });
  });

  test('addTransactionToFiscalBook throws when book missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);

    await expect(addTransactionToFiscalBook('fb1', 't1')).rejects.toThrow(
      'Fiscal book not found'
    );

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  test('addTransactionToFiscalBook throws when transaction missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.findById.mockResolvedValue(null);

    await expect(addTransactionToFiscalBook('fb1', 't1')).rejects.toThrow(
      'Transaction not found'
    );

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  test('addTransactionToFiscalBook throws on invalid relationship', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.findById.mockResolvedValue({ id: 't1' });
    validator.validateTransactionFiscalBookRelationship.mockReturnValue({
      isValid: false,
      errors: ['bad'],
    });

    await expect(addTransactionToFiscalBook('fb1', 't1')).rejects.toThrow(
      'Invalid transaction-book relationship: bad'
    );

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  test('removeTransactionFromFiscalBook updates transaction', async () => {
    transactionRepository.findById.mockResolvedValue({ id: 't1' });
    transactionRepository.updateById.mockResolvedValue({ id: 't1' });

    const result = await removeTransactionFromFiscalBook('t1');

    expect(session.startTransaction).toHaveBeenCalled();
    expect(transactionRepository.updateById).toHaveBeenCalledWith(
      't1',
      { $unset: { fiscalBookId: '' } },
      session
    );
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual({ id: 't1' });
  });

  test('removeTransactionFromFiscalBook throws when transaction missing', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    await expect(removeTransactionFromFiscalBook('t1')).rejects.toThrow(
      'Transaction not found'
    );

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  test('bulkAddTransactionsToFiscalBook updates transactions', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateById
      .mockResolvedValueOnce({ id: 't1' })
      .mockResolvedValueOnce(null);

    const result = await bulkAddTransactionsToFiscalBook('fb1', ['t1', 't2']);

    expect(session.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual({ success: true, updatedCount: 1, failedCount: 1 });
  });

  test('bulkAddTransactionsToFiscalBook throws when book missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);

    await expect(
      bulkAddTransactionsToFiscalBook('fb1', ['t1'])
    ).rejects.toThrow('Fiscal book not found');

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });
});

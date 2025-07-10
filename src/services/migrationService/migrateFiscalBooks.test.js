import { jest } from '@jest/globals';

const startSession = jest.fn();
const Types = {
  ObjectId: jest.fn(function () {
    return {
      toString: () => 'oid-1',
      toJSON: () => 'oid-1',
    };
  }),
};
const mongooseMock = {
  startSession,
  Types,
  connection: { readyState: 1 },
  connect: jest.fn(),
};

const transactionRepository = {
  findAllInYear: jest.fn(),
  findAllInPeriod: jest.fn(),
  updateFiscalBookForTransactions: jest.fn(),
  findPeriods: jest.fn(),
};

const fiscalBookRepository = {
  insert: jest.fn(),
};

jest.unstable_mockModule('mongoose', () => ({
  default: mongooseMock,
  startSession,
  Types,
  connection: mongooseMock.connection,
  connect: mongooseMock.connect,
}));

jest.unstable_mockModule('../../repository/transactionRepository.js', () => ({
  ...transactionRepository,
}));

jest.unstable_mockModule('../../repository/fiscalBookRepository.js', () => ({
  ...fiscalBookRepository,
}));

const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const {
  migrateTransactionsToFiscalBooks,
  groupTransactionsByPeriod,
} = await import('./migrateFiscalBooks.js');

describe('migrateFiscalBooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  test('migrates transactions for a period', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    transactionRepository.findAllInPeriod.mockResolvedValue([
      { _id: 't1' },
      { _id: 't2' },
    ]);
    fiscalBookRepository.insert.mockResolvedValue({ _id: 'fb1' });

    const result = await migrateTransactionsToFiscalBooks({
      period: '2024-01',
      bookType: 'Entrada',
    });

    expect(transactionRepository.findAllInPeriod).toHaveBeenCalledWith('2024-01');
    expect(fiscalBookRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        bookName: 'Entrada - 2024-01',
        bookPeriod: '2024-01',
        bookType: 'Entrada',
        status: 'Fechado',
      }),
      session
    );
    expect(transactionRepository.updateFiscalBookForTransactions).toHaveBeenCalledWith(
      ['t1', 't2'],
      'fb1',
      session
    );
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  test('filters transactions by company and year', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    transactionRepository.findAllInYear.mockResolvedValue([
      { _id: 't1', companyId: { toString: () => 'c1' } },
      { _id: 't2', companyId: { toString: () => 'c2' } },
      { _id: 't3', companyId: { toString: () => 'c1' }, fiscalBookId: 'fb' },
    ]);

    const result = await migrateTransactionsToFiscalBooks({
      period: '2024',
      companyId: 'c1',
      dryRun: true,
    });

    expect(transactionRepository.findAllInYear).toHaveBeenCalledWith('2024');
    expect(result.count).toBe(1);
    expect(result.fiscalBook._id.toString()).toBe('oid-1');
  });

  test('returns early when no transactions', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    transactionRepository.findAllInPeriod.mockResolvedValue([]);

    const result = await migrateTransactionsToFiscalBooks({
      period: '2024-02',
      dryRun: false,
    });

    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('No transactions found to migrate');
    expect(result.count).toBe(0);
  });

  test('dry run skips insert and update', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    transactionRepository.findAllInPeriod.mockResolvedValue([{ _id: 't1' }]);

    const result = await migrateTransactionsToFiscalBooks({
      period: '2024-03',
      dryRun: true,
    });

    expect(fiscalBookRepository.insert).not.toHaveBeenCalled();
    expect(transactionRepository.updateFiscalBookForTransactions).not.toHaveBeenCalled();
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  test('returns failure when migration throws', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    transactionRepository.findAllInPeriod.mockRejectedValue(new Error('db'));

    const result = await migrateTransactionsToFiscalBooks({
      period: '2024-05',
      dryRun: false,
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Migration failed: db');
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('throws when period is missing', async () => {
    await expect(migrateTransactionsToFiscalBooks({ period: '' })).rejects.toThrow(
      'Period is required'
    );
  });

  test('groupTransactionsByPeriod processes year periods', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    transactionRepository.findPeriods.mockResolvedValue([
      '2024-01',
      '2024-02',
      '2023-12',
    ]);
    transactionRepository.findAllInPeriod.mockResolvedValue([]);

    const result = await groupTransactionsByPeriod({
      year: '2024',
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.message).toBe('Processed 2 periods');
  });

  test('groupTransactionsByPeriod returns error when year missing', async () => {
    await expect(groupTransactionsByPeriod({})).rejects.toThrow('Year is required');
  });

  test('groupTransactionsByPeriod returns failure on error', async () => {
    transactionRepository.findPeriods.mockRejectedValue(new Error('db'));

    const result = await groupTransactionsByPeriod({ year: '2024' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Operation failed: db');
  });
});

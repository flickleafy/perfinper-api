import { jest } from '@jest/globals';

const TransactionModel = jest.fn(function (data) {
  this.data = data;
  this.id = data && data.id ? data.id : 'new-id';
  this.save = jest.fn().mockResolvedValue(this);
  return this;
});

TransactionModel.find = jest.fn();
TransactionModel.findById = jest.fn();
TransactionModel.findByIdAndDelete = jest.fn();
TransactionModel.findByIdAndUpdate = jest.fn();
TransactionModel.deleteMany = jest.fn();
TransactionModel.distinct = jest.fn();
TransactionModel.aggregate = jest.fn();
TransactionModel.updateMany = jest.fn();

const startSession = jest.fn();

jest.unstable_mockModule('../models/TransactionModel.js', () => ({
  default: TransactionModel,
}));

jest.unstable_mockModule('mongoose', () => ({
  startSession,
}));

const repository = await import('./transactionRepository.js');
const {
  findAll,
  findAllWithCompanyCnpj,
  findPeriods,
  findYears,
  deleteAllInPeriod,
  deleteById,
  deleteByIds,
  updateById,
  findAllInPeriod,
  findAllInYear,
  findById,
  insert,
  separateById,
  getTransactionsIdEmptyCnpj,
  getTransactionsIdTransactionSource,
  findCreditCardInstallments,
  findAllByDescription,
  findByFiscalBookId,
  updateFiscalBookForTransactions,
  removeFiscalBookFromTransactions,
} = repository;

let consoleError;
let consoleWarn;

const makeSortQuery = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

const makeSortSelectQuery = (result) => {
  const select = jest.fn().mockResolvedValue(result);
  const sort = jest.fn().mockReturnValue({ select });
  return { sort, select };
};

const makeExecQuery = (result) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result),
});

describe('transactionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  test('findAll returns sorted transactions', async () => {
    TransactionModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findAll();

    expect(TransactionModel.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAll throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAll()).rejects.toThrow(
      'Failed to retrieve all transactions.'
    );
  });

  test('findAllWithCompanyCnpj filters for CNPJ', async () => {
    TransactionModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findAllWithCompanyCnpj();

    expect(TransactionModel.find).toHaveBeenCalledWith({
      companyCnpj: { $exists: true, $nin: [null, '', undefined] },
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAllWithCompanyCnpj throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAllWithCompanyCnpj()).rejects.toThrow(
      'Failed to retrieve transactions with company CNPJ.'
    );
  });

  test('findPeriods returns distinct periods', async () => {
    TransactionModel.distinct.mockResolvedValue(['2024-01']);

    const result = await findPeriods();

    expect(TransactionModel.distinct).toHaveBeenCalledWith('transactionPeriod');
    expect(result).toEqual(['2024-01']);
  });

  test('findPeriods throws on error', async () => {
    TransactionModel.distinct.mockRejectedValue(new Error('db'));

    await expect(findPeriods()).rejects.toThrow(
      'Failed to retrieve distinct transaction periods.'
    );
  });

  test('findYears returns distinct years array', async () => {
    TransactionModel.aggregate.mockResolvedValue([
      { distinctYears: ['2022', '2023'] },
    ]);

    const result = await findYears();

    expect(result).toEqual(['2022', '2023']);
  });

  test('findYears throws on error', async () => {
    TransactionModel.aggregate.mockRejectedValue(new Error('db'));

    await expect(findYears()).rejects.toThrow(
      'Failed to retrieve distinct transaction years.'
    );
  });

  test('deleteAllInPeriod deletes with regex filter', async () => {
    TransactionModel.deleteMany.mockResolvedValue({});

    await deleteAllInPeriod('2024-01');

    expect(TransactionModel.deleteMany).toHaveBeenCalledWith({
      transactionPeriod: { $regex: expect.any(RegExp), $options: 'i' },
    });
  });

  test('deleteAllInPeriod deletes all when period missing', async () => {
    TransactionModel.deleteMany.mockResolvedValue({});

    await deleteAllInPeriod();

    expect(TransactionModel.deleteMany).toHaveBeenCalledWith({});
  });

  test('deleteAllInPeriod throws on error', async () => {
    TransactionModel.deleteMany.mockRejectedValue(new Error('db'));

    await expect(deleteAllInPeriod('2024')).rejects.toThrow(
      'Failed to delete transactions in the specified period.'
    );
  });

  test('deleteById supports session', async () => {
    TransactionModel.findByIdAndDelete.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await deleteById('1', session);

    expect(TransactionModel.findByIdAndDelete).toHaveBeenCalledWith('1', {
      session,
    });
    expect(result).toEqual({ id: '1' });
  });

  test('deleteById returns null when missing', async () => {
    TransactionModel.findByIdAndDelete.mockResolvedValue(null);

    const result = await deleteById('missing');

    expect(result).toBeNull();
  });

  test('deleteById throws on error', async () => {
    TransactionModel.findByIdAndDelete.mockRejectedValue(new Error('db'));

    await expect(deleteById('1')).rejects.toThrow(
      'An error occurred while deleting the transaction by ID.'
    );
  });

  test('deleteByIds deletes when ids provided', async () => {
    TransactionModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

    const result = await deleteByIds(['1', '2']);

    expect(TransactionModel.deleteMany).toHaveBeenCalledWith({
      _id: { $in: ['1', '2'] },
    });
    expect(result).toEqual({ deletedCount: 2 });
  });

  test('deleteByIds throws on invalid input', async () => {
    await expect(deleteByIds([])).rejects.toThrow(
      'An error occurred while deleting the transactions by IDs.'
    );
  });

  test('deleteByIds throws when none deleted', async () => {
    TransactionModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

    await expect(deleteByIds(['1'])).rejects.toThrow(
      'An error occurred while deleting the transactions by IDs.'
    );
  });

  test('updateById throws when id missing', async () => {
    await expect(updateById('', {})).rejects.toThrow(
      'An error occurred while updating transaction : Transaction ID is required for update'
    );
  });

  test('updateById returns updated transaction with session', async () => {
    TransactionModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await updateById('1', { status: 'done' }, session);

    expect(TransactionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { status: 'done' },
      { new: true, session }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateById returns null when not found', async () => {
    TransactionModel.findByIdAndUpdate.mockResolvedValue(null);

    const result = await updateById('1', { status: 'done' });

    // expect(consoleWarn).toHaveBeenCalledWith(
    //   'Transaction with ID 1 not found for update'
    // );
    expect(result).toBeNull();
  });

  test('updateById throws on error', async () => {
    TransactionModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

    await expect(updateById('1', {})).rejects.toThrow(
      'An error occurred while updating transaction 1: db'
    );
  });

  test('findAllInPeriod returns transactions', async () => {
    TransactionModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findAllInPeriod('2024-01');

    expect(TransactionModel.find).toHaveBeenCalledWith({
      transactionPeriod: '2024-01',
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAllInPeriod throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAllInPeriod('2024-01')).rejects.toThrow(
      'Failed to find transactions in the specified period.'
    );
  });

  test('findAllInYear uses regex', async () => {
    TransactionModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findAllInYear('2024');

    const filter = TransactionModel.find.mock.calls[0][0];
    expect(filter.transactionPeriod).toBeInstanceOf(RegExp);
    expect(filter.transactionPeriod.source).toBe('^2024-');
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAllInYear throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAllInYear('2024')).rejects.toThrow(
      'Failed to find transactions in the specified year.'
    );
  });

  test('findById supports session', async () => {
    TransactionModel.findById.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await findById('1', session);

    expect(TransactionModel.findById).toHaveBeenCalledWith('1', { session });
    expect(result).toEqual({ id: '1' });
  });

  test('findById returns null when missing', async () => {
    TransactionModel.findById.mockResolvedValue(null);

    const result = await findById('missing');

    expect(result).toBeNull();
  });

  test('findById throws on error', async () => {
    TransactionModel.findById.mockRejectedValue(new Error('db'));

    await expect(findById('1')).rejects.toThrow(
      'An error occurred while finding the transaction by ID.'
    );
  });

  test('insert saves transaction with session', async () => {
    const session = { id: 's' };
    const result = await insert({ transactionValue: '10' }, session);

    const instance = TransactionModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith({ session });
    expect(result).toBe(instance);
  });

  test('insert saves transaction without session', async () => {
    const result = await insert({ transactionValue: '12' });

    const instance = TransactionModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith();
    expect(result).toBe(instance);
  });

  test('insert throws on error', async () => {
    const instance = {
      save: jest.fn().mockRejectedValue(new Error('save fail')),
    };
    TransactionModel.mockImplementationOnce(() => instance);

    await expect(insert({ transactionValue: '10' })).rejects.toThrow(
      'An error occurred while inserting the transaction.'
    );
  });

  test('separateById separates items and deletes original', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    const transaction = {
      id: 't1',
      items: [{ itemValue: '10' }, { itemValue: '20' }],
      transactionDescription: 'Base',
      toObject: jest.fn(() => ({
        id: 't1',
        transactionDescription: 'Base',
        transactionValue: '30',
      })),
    };
    TransactionModel.findById.mockResolvedValue(transaction);
    TransactionModel.findByIdAndDelete.mockResolvedValue(transaction);

    const result = await separateById('t1');

    expect(session.startTransaction).toHaveBeenCalledTimes(1);
    expect(TransactionModel.findById).toHaveBeenCalledWith('t1');
    expect(TransactionModel.mock.instances.length).toBeGreaterThan(0);
    const instance = TransactionModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith({ session });
    expect(TransactionModel.findByIdAndDelete).toHaveBeenCalledWith('t1', {
      session,
    });
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual(transaction);
  });

  test('separateById throws when too few items', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    TransactionModel.findById.mockResolvedValue({
      id: 't1',
      items: [{ itemValue: '10' }],
      transactionDescription: 'Base',
      toObject: jest.fn(() => ({
        id: 't1',
        transactionDescription: 'Base',
        transactionValue: '10',
      })),
    });

    await expect(separateById('t1')).rejects.toThrow(
      'Failed to separate transactions by ID.'
    );
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('separateById throws when insert lacks id', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    startSession.mockResolvedValue(session);

    TransactionModel.findById.mockResolvedValue({
      id: 't1',
      items: [{ itemValue: '10' }, { itemValue: '20' }],
      transactionDescription: 'Base',
      toObject: jest.fn(() => ({
        id: 't1',
        transactionDescription: 'Base',
        transactionValue: '30',
      })),
    });

    TransactionModel.mockImplementationOnce(function (data) {
      this.data = data;
      this.id = null;
      this.save = jest.fn().mockResolvedValue(this);
      return this;
    });

    await expect(separateById('t1')).rejects.toThrow(
      'Failed to separate transactions by ID.'
    );
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('getTransactionsIdEmptyCnpj returns ids', async () => {
    const query = makeSortSelectQuery([{ _id: '1' }, { _id: '2' }]);
    TransactionModel.find.mockReturnValue(query);

    const result = await getTransactionsIdEmptyCnpj();

    expect(query.sort).toHaveBeenCalledWith({ transactionDate: 1 });
    expect(query.select).toHaveBeenCalledWith('_id');
    expect(result).toEqual(['1', '2']);
  });

  test('getTransactionsIdEmptyCnpj throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(getTransactionsIdEmptyCnpj()).rejects.toThrow(
      'An error occurred while retrieving transactions.'
    );
  });

  test('getTransactionsIdTransactionSource returns ids', async () => {
    const query = makeSortSelectQuery([{ _id: '1' }]);
    TransactionModel.find.mockReturnValue(query);

    const result = await getTransactionsIdTransactionSource('manual');

    expect(TransactionModel.find).toHaveBeenCalledWith({
      transactionSource: 'manual',
    });
    expect(result).toEqual(['1']);
  });

  test('getTransactionsIdTransactionSource throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(getTransactionsIdTransactionSource('manual')).rejects.toThrow(
      'An error occurred while retrieving transactions.'
    );
  });

  test('findCreditCardInstallments returns aggregate list', async () => {
    TransactionModel.aggregate.mockResolvedValue([
      { transactionDescription: 'Store - 1/2' },
    ]);

    const result = await findCreditCardInstallments();

    expect(result).toEqual([{ transactionDescription: 'Store - 1/2' }]);
  });

  test('findCreditCardInstallments throws on error', async () => {
    TransactionModel.aggregate.mockRejectedValue(new Error('db'));

    await expect(findCreditCardInstallments()).rejects.toThrow(
      'Failed to retrieve distinct credit card installments.'
    );
  });

  test('findAllByDescription filters by regex', async () => {
    TransactionModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findAllByDescription('store');

    const filter = TransactionModel.find.mock.calls[0][0];
    expect(filter.transactionDescription).toBeInstanceOf(RegExp);
    expect(filter.transactionDescription.flags).toContain('i');
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAllByDescription throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAllByDescription('store')).rejects.toThrow(
      'Failed to find transactions with the specified description.'
    );
  });

  test('findByFiscalBookId supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    TransactionModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByFiscalBookId('fb1', session);

    expect(TransactionModel.find).toHaveBeenCalledWith({ fiscalBookId: 'fb1' });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByFiscalBookId throws on error', async () => {
    TransactionModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByFiscalBookId('fb1')).rejects.toThrow(
      'An error occurred while finding transactions by fiscal book ID.'
    );
  });

  test('updateFiscalBookForTransactions updates many', async () => {
    TransactionModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

    const session = { id: 's' };
    const result = await updateFiscalBookForTransactions(
      ['1', '2'],
      'fb1',
      session
    );

    expect(TransactionModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['1', '2'] } },
      { $set: { fiscalBookId: 'fb1' } },
      { multi: true, session }
    );
    expect(result).toEqual({ modifiedCount: 2 });
  });

  test('updateFiscalBookForTransactions throws on error', async () => {
    TransactionModel.updateMany.mockRejectedValue(new Error('db'));

    await expect(
      updateFiscalBookForTransactions(['1'], 'fb1')
    ).rejects.toThrow(
      'An error occurred while updating fiscal book ID for transactions.'
    );
  });

  test('removeFiscalBookFromTransactions updates many', async () => {
    TransactionModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

    const session = { id: 's' };
    const result = await removeFiscalBookFromTransactions('fb1', session);

    expect(TransactionModel.updateMany).toHaveBeenCalledWith(
      { fiscalBookId: 'fb1' },
      { $unset: { fiscalBookId: '' } },
      { multi: true, session }
    );
    expect(result).toEqual({ modifiedCount: 2 });
  });

  test('removeFiscalBookFromTransactions throws on error', async () => {
    TransactionModel.updateMany.mockRejectedValue(new Error('db'));

    await expect(removeFiscalBookFromTransactions('fb1')).rejects.toThrow(
      'An error occurred while removing fiscal book ID from transactions.'
    );
  });
});

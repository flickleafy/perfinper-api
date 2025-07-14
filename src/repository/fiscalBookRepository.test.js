import { jest } from '@jest/globals';

const FiscalBookModel = jest.fn(function (data) {
  this.data = data;
  this.save = jest.fn().mockResolvedValue(this);
  return this;
});

FiscalBookModel.find = jest.fn();
FiscalBookModel.findById = jest.fn();
FiscalBookModel.findByIdAndUpdate = jest.fn();
FiscalBookModel.findByIdAndDelete = jest.fn();
FiscalBookModel.aggregate = jest.fn();

jest.unstable_mockModule('../models/FiscalBookModel.js', () => ({
  default: FiscalBookModel,
}));

const repository = await import('./fiscalBookRepository.js');
const {
  findAll,
  findAllWithStats,
  findById,
  findByType,
  findByPeriod,
  findByStatus,
  findByCompany,
  insert,
  updateById,
  deleteById,
  closeBook,
  reopenBook,
  getStatistics,
  findBookTransactions,
} = repository;

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const makeQuery = (result) => {
  const query = {
    session: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

const makeExecQuery = (result) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result),
});

describe('fiscalBookRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  test('findAll applies options and session', async () => {
    const query = makeQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findAll(
      { bookType: 'Entrada' },
      { limit: 5, skip: 2, sort: { createdAt: -1 } },
      session
    );

    expect(FiscalBookModel.find).toHaveBeenCalledWith({ bookType: 'Entrada' });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.skip).toHaveBeenCalledWith(2);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAll throws on error', async () => {
    FiscalBookModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAll()).rejects.toThrow(
      'Failed to retrieve all fiscal books.'
    );
  });

  // ===== findAllWithStats =====
  test('findAllWithStats returns aggregated results', async () => {
    FiscalBookModel.aggregate.mockResolvedValue([{ id: '1', transactionCount: 5 }]);

    const result = await findAllWithStats({ status: 'Aberto' });

    expect(FiscalBookModel.aggregate).toHaveBeenCalled();
    const pipeline = FiscalBookModel.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({ $match: { status: 'Aberto' } });
    expect(result).toEqual([{ id: '1', transactionCount: 5 }]);
  });

  test('findAllWithStats handles string sort format descending', async () => {
    FiscalBookModel.aggregate.mockResolvedValue([]);

    await findAllWithStats({}, { sort: '-createdAt' });

    const pipeline = FiscalBookModel.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find(stage => stage.$sort);
    expect(sortStage.$sort).toEqual({ createdAt: -1 });
  });

  test('findAllWithStats handles string sort format ascending', async () => {
    FiscalBookModel.aggregate.mockResolvedValue([]);

    await findAllWithStats({}, { sort: 'bookName' });

    const pipeline = FiscalBookModel.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find(stage => stage.$sort);
    expect(sortStage.$sort).toEqual({ bookName: 1 });
  });

  test('findAllWithStats handles object sort format', async () => {
    FiscalBookModel.aggregate.mockResolvedValue([]);

    await findAllWithStats({}, { sort: { updatedAt: -1 } });

    const pipeline = FiscalBookModel.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find(stage => stage.$sort);
    expect(sortStage.$sort).toEqual({ updatedAt: -1 });
  });

  test('findAllWithStats applies skip and limit', async () => {
    FiscalBookModel.aggregate.mockResolvedValue([]);

    await findAllWithStats({}, { skip: 10, limit: 5 });

    const pipeline = FiscalBookModel.aggregate.mock.calls[0][0];
    const skipStage = pipeline.find(stage => stage.$skip);
    const limitStage = pipeline.find(stage => stage.$limit);
    expect(skipStage.$skip).toBe(10);
    expect(limitStage.$limit).toBe(5);
  });

  test('findAllWithStats throws on error', async () => {
    FiscalBookModel.aggregate.mockRejectedValue(new Error('db'));

    await expect(findAllWithStats()).rejects.toThrow(
      'Failed to retrieve fiscal books with statistics.'
    );
  });

  test('findById supports session', async () => {
    const query = { session: jest.fn().mockResolvedValue({ id: '1' }) };
    FiscalBookModel.findById.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findById('1', session);

    expect(FiscalBookModel.findById).toHaveBeenCalledWith('1');
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ id: '1' });
  });

  test('findById returns null when missing', async () => {
    FiscalBookModel.findById.mockResolvedValue(null);

    const result = await findById('missing');

    expect(result).toBeNull();
  });

  test('findById throws on error', async () => {
    FiscalBookModel.findById.mockRejectedValue(new Error('db'));

    await expect(findById('1')).rejects.toThrow(
      'An error occurred while finding the fiscal book by ID.'
    );
  });

  test('findByType returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const result = await findByType('Entrada');

    expect(FiscalBookModel.find).toHaveBeenCalledWith({ bookType: 'Entrada' });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByType supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByType('Entrada', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByType throws on error', async () => {
    FiscalBookModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByType('Entrada')).rejects.toThrow(
      'An error occurred while finding fiscal books by type.'
    );
  });

  test('findByPeriod returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const result = await findByPeriod('2024-01');

    expect(FiscalBookModel.find).toHaveBeenCalledWith({ bookPeriod: '2024-01' });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByPeriod supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByPeriod('2024-01', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByPeriod throws on error', async () => {
    FiscalBookModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByPeriod('2024-01')).rejects.toThrow(
      'An error occurred while finding fiscal books by period.'
    );
  });

  test('findByStatus returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const result = await findByStatus('Aberto');

    expect(FiscalBookModel.find).toHaveBeenCalledWith({ status: 'Aberto' });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByStatus supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByStatus('Aberto', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByStatus throws on error', async () => {
    FiscalBookModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByStatus('Aberto')).rejects.toThrow(
      'An error occurred while finding fiscal books by status.'
    );
  });

  test('findByCompany returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const result = await findByCompany('company-1');

    expect(FiscalBookModel.find).toHaveBeenCalledWith({
      companyId: 'company-1',
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByCompany supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    FiscalBookModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByCompany('company-1', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByCompany throws on error', async () => {
    FiscalBookModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByCompany('company-1')).rejects.toThrow(
      'An error occurred while finding fiscal books by company.'
    );
  });

  test('insert saves fiscal book with session', async () => {
    const session = { id: 's' };
    const result = await insert({ bookName: 'Book' }, session);

    const instance = FiscalBookModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith({ session });
    expect(result).toBe(instance);
  });

  test('insert throws on error', async () => {
    const instance = {
      save: jest.fn().mockRejectedValue(new Error('save fail')),
    };
    FiscalBookModel.mockImplementationOnce(() => instance);

    await expect(insert({ bookName: 'Book' })).rejects.toThrow(
      'An error occurred while inserting the fiscal book.'
    );
  });

  test('updateById returns updated book', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const result = await updateById('1', { status: 'Fechado' });

    expect(FiscalBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { status: 'Fechado' },
      { new: true }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateById supports session', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await updateById('1', { status: 'Fechado' }, session);

    expect(FiscalBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { status: 'Fechado' },
      { new: true, session }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateById returns null when missing', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue(null);

    const result = await updateById('missing', {});

    expect(result).toBeNull();
  });

  test('updateById throws on error', async () => {
    FiscalBookModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

    await expect(updateById('1', {})).rejects.toThrow(
      'An error occurred while updating the fiscal book.'
    );
  });

  test('deleteById returns deleted book', async () => {
    FiscalBookModel.findByIdAndDelete.mockResolvedValue({ id: '1' });

    const result = await deleteById('1');

    expect(FiscalBookModel.findByIdAndDelete).toHaveBeenCalledWith('1', {});
    expect(result).toEqual({ id: '1' });
  });

  test('deleteById supports session', async () => {
    FiscalBookModel.findByIdAndDelete.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await deleteById('1', session);

    expect(FiscalBookModel.findByIdAndDelete).toHaveBeenCalledWith('1', {
      session,
    });
    expect(result).toEqual({ id: '1' });
  });

  test('deleteById returns null when missing', async () => {
    FiscalBookModel.findByIdAndDelete.mockResolvedValue(null);

    const result = await deleteById('missing');

    expect(result).toBeNull();
  });

  test('deleteById throws on error', async () => {
    FiscalBookModel.findByIdAndDelete.mockRejectedValue(new Error('db'));

    await expect(deleteById('1')).rejects.toThrow(
      'An error occurred while deleting the fiscal book.'
    );
  });

  test('closeBook updates status and timestamps', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const result = await closeBook('1');

    expect(FiscalBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        status: 'Fechado',
      }),
      { new: true }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('closeBook returns null when missing', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue(null);

    const result = await closeBook('missing');

    expect(result).toBeNull();
  });

  test('closeBook supports session', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await closeBook('1', session);

    expect(FiscalBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        status: 'Fechado',
      }),
      { new: true, session }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('closeBook throws on error', async () => {
    FiscalBookModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

    await expect(closeBook('1')).rejects.toThrow(
      'An error occurred while closing the fiscal book.'
    );
  });

  test('reopenBook updates status and timestamps', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await reopenBook('1', session);

    expect(FiscalBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        status: 'Em Revisão',
      }),
      { new: true, session }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('reopenBook returns null when missing', async () => {
    FiscalBookModel.findByIdAndUpdate.mockResolvedValue(null);

    const result = await reopenBook('missing');

    expect(result).toBeNull();
  });

  test('reopenBook throws on error', async () => {
    FiscalBookModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

    await expect(reopenBook('1')).rejects.toThrow(
      'An error occurred while reopening the fiscal book.'
    );
  });

  test('getStatistics returns aggregate results and supports session', async () => {
    const query = makeExecQuery([
      {
        total: 1,
        openBooks: 1,
        closedBooks: 0,
        inReviewBooks: 0,
        archivedBooks: 0,
        byType: { Entrada: 1 },
        byPeriod: { '2024-01': 1 },
      },
    ]);
    FiscalBookModel.aggregate.mockReturnValue(query);

    const session = { id: 's' };
    const result = await getStatistics(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({
      total: 1,
      openBooks: 1,
      closedBooks: 0,
      inReviewBooks: 0,
      archivedBooks: 0,
      byType: { Entrada: 1 },
      byPeriod: { '2024-01': 1 },
    });
  });

  test('getStatistics returns defaults when empty', async () => {
    const query = makeExecQuery([]);
    FiscalBookModel.aggregate.mockReturnValue(query);

    const result = await getStatistics();

    expect(result).toEqual({
      total: 0,
      openBooks: 0,
      closedBooks: 0,
      inReviewBooks: 0,
      archivedBooks: 0,
      byType: {},
      byPeriod: {},
    });
  });

  test('getStatistics throws on error', async () => {
    FiscalBookModel.aggregate.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(getStatistics()).rejects.toThrow(
      'An error occurred while getting fiscal book statistics.'
    );
  });

  test('findBookTransactions returns results and supports session', async () => {
    const transactionQuery = makeExecQuery([{ id: 't1' }]);
    const TransactionModel = {
      find: jest.fn().mockReturnValue(transactionQuery),
    };

    const session = { id: 's' };
    const result = await findBookTransactions(
      'book-1',
      TransactionModel,
      session
    );

    expect(TransactionModel.find).toHaveBeenCalledWith({ fiscalBookId: 'book-1' });
    expect(transactionQuery.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: 't1' }]);
  });

  test('findBookTransactions throws on error', async () => {
    const TransactionModel = {
      find: jest.fn(() => {
        throw new Error('db');
      }),
    };

    await expect(findBookTransactions('book-1', TransactionModel)).rejects.toThrow(
      'An error occurred while finding transactions for the fiscal book.'
    );
  });
});

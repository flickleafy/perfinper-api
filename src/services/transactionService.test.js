import { jest } from '@jest/globals';

const transactionRepository = {
  insert: jest.fn(),
  findById: jest.fn(),
  findAllInPeriod: jest.fn(),
  findAllInYear: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  separateById: jest.fn(),
  deleteAllInPeriod: jest.fn(),
  findPeriods: jest.fn(),
  findYears: jest.fn(),
  findByFiscalBookId: jest.fn(),
  updateFiscalBookForTransactions: jest.fn(),
  removeFiscalBookFromTransactions: jest.fn(),
};

const fiscalBookRepository = {
  findById: jest.fn(),
};

const transactionPrototype = jest.fn((body) => ({
  ...body,
  normalized: true,
}));

const logger = { error: jest.fn() };

jest.unstable_mockModule('../config/logger.js', () => ({
  default: logger,
}));

jest.unstable_mockModule('../repository/transactionRepository.js', () => ({
  ...transactionRepository,
}));

jest.unstable_mockModule('../repository/fiscalBookRepository.js', () => ({
  ...fiscalBookRepository,
}));

jest.unstable_mockModule('./prototype/transactionPrototype.js', () => ({
  transactionPrototype,
}));

const service = await import('./transactionService.js');
const {
  insertTransaction,
  findTransactionById,
  findAllTransactionsInPeriod,
  updateTransactionById,
  deleteTransactionById,
  separateTransactionById,
  removeAllTransactionsInPeriod,
  findUniquePeriods,
  findUniqueYears,
  getTransactionsByFiscalBookId,
  assignTransactionsToFiscalBook,
  removeTransactionsFromFiscalBook,
  updateTransactionFiscalBook,
} = service;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('transactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('insertTransaction inserts transaction', async () => {
    transactionRepository.insert.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await insertTransaction({ body: { amount: 10 } }, res);

    expect(transactionPrototype).toHaveBeenCalledWith({ amount: 10 });
    expect(transactionRepository.insert).toHaveBeenCalledWith({
      amount: 10,
      normalized: true,
    });
    expect(res.send).toHaveBeenCalledWith({ id: 't1' });
  });

  test('insertTransaction handles errors', async () => {
    transactionRepository.insert.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await insertTransaction({ body: { amount: 10 } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('insertTransaction uses fallback message when error has no message', async () => {
    transactionRepository.insert.mockRejectedValue({});
    const res = createRes();

    await insertTransaction({ body: { amount: 10 } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Algum erro ocorreu ao salvar transaction',
      })
    );
  });

  test('findTransactionById returns transaction', async () => {
    transactionRepository.findById.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await findTransactionById({ params: { id: 't1' } }, res);

    expect(res.send).toHaveBeenCalledWith({ id: 't1' });
  });

  test('findTransactionById returns 404 when missing', async () => {
    transactionRepository.findById.mockResolvedValue(null);
    const res = createRes();

    await findTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('findTransactionById handles errors', async () => {
    transactionRepository.findById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findTransactionById uses fallback message when error has no message', async () => {
    transactionRepository.findById.mockRejectedValue({});
    const res = createRes();

    await findTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Erro ao listar a transaction' })
    );
  });

  test('findAllTransactionsInPeriod uses year when length is 4', async () => {
    transactionRepository.findAllInYear.mockResolvedValue([{ id: 't1' }]);
    const res = createRes();

    await findAllTransactionsInPeriod(
      { params: { transactionPeriod: '2024' } },
      res
    );

    expect(transactionRepository.findAllInYear).toHaveBeenCalledWith('2024');
    expect(res.send).toHaveBeenCalledWith([{ id: 't1' }]);
  });

  test('findAllTransactionsInPeriod uses period when length is not 4', async () => {
    transactionRepository.findAllInPeriod.mockResolvedValue([{ id: 't1' }]);
    const res = createRes();

    await findAllTransactionsInPeriod(
      { params: { transactionPeriod: '2024-01' } },
      res
    );

    expect(transactionRepository.findAllInPeriod).toHaveBeenCalledWith('2024-01');
    expect(res.send).toHaveBeenCalledWith([{ id: 't1' }]);
  });

  test('findAllTransactionsInPeriod handles errors', async () => {
    transactionRepository.findAllInPeriod.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findAllTransactionsInPeriod(
      { params: { transactionPeriod: '2024-01' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateTransactionById validates body', async () => {
    const res = createRes();

    await updateTransactionById({ params: { id: 't1' }, body: null }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateTransactionById updates transaction', async () => {
    transactionRepository.updateById.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await updateTransactionById(
      { params: { id: 't1' }, body: { amount: 10 } },
      res
    );

    expect(transactionPrototype).toHaveBeenCalledWith({ amount: 10 });
    expect(transactionRepository.updateById).toHaveBeenCalledWith('t1', {
      amount: 10,
      normalized: true,
    });
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateTransactionById returns 404 when missing', async () => {
    transactionRepository.updateById.mockResolvedValue(null);
    const res = createRes();

    await updateTransactionById(
      { params: { id: 't1' }, body: { amount: 10 } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateTransactionById handles errors', async () => {
    transactionRepository.updateById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updateTransactionById(
      { params: { id: 't1' }, body: { amount: 10 } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteTransactionById deletes transaction', async () => {
    transactionRepository.deleteById.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await deleteTransactionById({ params: { id: 't1' } }, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('deleteTransactionById returns 404 when missing', async () => {
    transactionRepository.deleteById.mockResolvedValue(null);
    const res = createRes();

    await deleteTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteTransactionById handles errors', async () => {
    transactionRepository.deleteById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await deleteTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('separateTransactionById separates transaction', async () => {
    transactionRepository.separateById.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await separateTransactionById({ params: { id: 't1' } }, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('separateTransactionById returns 404 when missing', async () => {
    transactionRepository.separateById.mockResolvedValue(null);
    const res = createRes();

    await separateTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('separateTransactionById handles errors', async () => {
    transactionRepository.separateById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await separateTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('separateTransactionById uses fallback message when error has no message', async () => {
    transactionRepository.separateById.mockRejectedValue({});
    const res = createRes();

    await separateTransactionById({ params: { id: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Algum erro ocorreu ao separar transaction',
      })
    );
  });

  test('removeAllTransactionsInPeriod deletes transactions', async () => {
    transactionRepository.deleteAllInPeriod.mockResolvedValue(undefined);
    const res = createRes();

    await removeAllTransactionsInPeriod({ params: { transactionPeriod: '2024-01' } }, res);

    expect(transactionRepository.deleteAllInPeriod).toHaveBeenCalledWith('2024-01');
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('removeAllTransactionsInPeriod handles errors', async () => {
    transactionRepository.deleteAllInPeriod.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await removeAllTransactionsInPeriod({ params: { transactionPeriod: '2024-01' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findUniquePeriods returns periods', async () => {
    transactionRepository.findPeriods.mockResolvedValue(['2024-01']);
    const res = createRes();

    await findUniquePeriods({}, res);

    expect(res.send).toHaveBeenCalledWith(['2024-01']);
  });

  test('findUniquePeriods handles errors', async () => {
    transactionRepository.findPeriods.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findUniquePeriods({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findUniqueYears returns years', async () => {
    transactionRepository.findYears.mockResolvedValue(['2024']);
    const res = createRes();

    await findUniqueYears({}, res);

    expect(res.send).toHaveBeenCalledWith(['2024']);
  });

  test('findUniqueYears handles errors', async () => {
    transactionRepository.findYears.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findUniqueYears({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getTransactionsByFiscalBookId returns transactions', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.findByFiscalBookId.mockResolvedValue([{ id: 't1' }]);
    const res = createRes();

    await getTransactionsByFiscalBookId(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith([{ id: 't1' }]);
  });

  test('getTransactionsByFiscalBookId returns 404 when fiscal book missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);
    const res = createRes();

    await getTransactionsByFiscalBookId(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getTransactionsByFiscalBookId handles errors', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.findByFiscalBookId.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await getTransactionsByFiscalBookId(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getTransactionsByFiscalBookId uses fallback message when error has no message', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.findByFiscalBookId.mockRejectedValue({});
    const res = createRes();

    await getTransactionsByFiscalBookId(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error retrieving transactions for fiscal book fb1',
      })
    );
  });

  test('assignTransactionsToFiscalBook validates payload', async () => {
    const res = createRes();

    await assignTransactionsToFiscalBook({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('assignTransactionsToFiscalBook returns 404 when fiscal book missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);
    const res = createRes();

    await assignTransactionsToFiscalBook(
      { body: { fiscalBookId: 'fb1', transactionIds: ['t1'] } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('assignTransactionsToFiscalBook assigns transactions', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateFiscalBookForTransactions.mockResolvedValue({
      modifiedCount: 2,
    });
    const res = createRes();

    await assignTransactionsToFiscalBook(
      { body: { fiscalBookId: 'fb1', transactionIds: ['t1', 't2'] } },
      res
    );

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ modifiedCount: 2 })
    );
  });

  test('assignTransactionsToFiscalBook handles errors', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateFiscalBookForTransactions.mockRejectedValue(
      new Error('fail')
    );
    const res = createRes();

    await assignTransactionsToFiscalBook(
      { body: { fiscalBookId: 'fb1', transactionIds: ['t1'] } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('assignTransactionsToFiscalBook uses fallback message when error has no message', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateFiscalBookForTransactions.mockRejectedValue({});
    const res = createRes();

    await assignTransactionsToFiscalBook(
      { body: { fiscalBookId: 'fb1', transactionIds: ['t1'] } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error assigning transactions to fiscal book',
      })
    );
  });

  test('removeTransactionsFromFiscalBook returns 404 when fiscal book missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);
    const res = createRes();

    await removeTransactionsFromFiscalBook(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('removeTransactionsFromFiscalBook removes transactions', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.removeFiscalBookFromTransactions.mockResolvedValue({
      modifiedCount: 3,
    });
    const res = createRes();

    await removeTransactionsFromFiscalBook(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ modifiedCount: 3 })
    );
  });

  test('removeTransactionsFromFiscalBook handles errors', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.removeFiscalBookFromTransactions.mockRejectedValue(
      new Error('fail')
    );
    const res = createRes();

    await removeTransactionsFromFiscalBook(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('removeTransactionsFromFiscalBook uses fallback message when error has no message', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.removeFiscalBookFromTransactions.mockRejectedValue({});
    const res = createRes();

    await removeTransactionsFromFiscalBook(
      { params: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error removing transactions from fiscal book fb1',
      })
    );
  });

  test('updateTransactionFiscalBook validates fiscalBookId', async () => {
    const res = createRes();

    await updateTransactionFiscalBook({ params: { id: 't1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateTransactionFiscalBook unsets fiscal book when null is provided', async () => {
    transactionRepository.updateById.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await updateTransactionFiscalBook(
      { params: { id: 't1' }, body: { fiscalBookId: null } },
      res
    );

    expect(fiscalBookRepository.findById).not.toHaveBeenCalled();
    expect(transactionRepository.updateById).toHaveBeenCalledWith('t1', {
      $unset: { fiscalBookId: '' },
    });
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateTransactionFiscalBook returns 404 when fiscal book missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue(null);
    const res = createRes();

    await updateTransactionFiscalBook(
      { params: { id: 't1' }, body: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateTransactionFiscalBook returns 404 when transaction missing', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateById.mockResolvedValue(null);
    const res = createRes();

    await updateTransactionFiscalBook(
      { params: { id: 't1' }, body: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateTransactionFiscalBook updates fiscal book', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateById.mockResolvedValue({ id: 't1' });
    const res = createRes();

    await updateTransactionFiscalBook(
      { params: { id: 't1' }, body: { fiscalBookId: 'fb1' } },
      res
    );

    expect(transactionRepository.updateById).toHaveBeenCalledWith('t1', {
      fiscalBookId: 'fb1',
    });
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateTransactionFiscalBook handles errors', async () => {
    fiscalBookRepository.findById.mockResolvedValue({ id: 'fb1' });
    transactionRepository.updateById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updateTransactionFiscalBook(
      { params: { id: 't1' }, body: { fiscalBookId: 'fb1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

import { jest } from '@jest/globals';

const createRouter = () => {
  const routes = [];
  const router = {
    routes,
    get: jest.fn((path, handler) => {
      routes.push({ method: 'get', path, handler });
      return router;
    }),
    post: jest.fn((path, handler) => {
      routes.push({ method: 'post', path, handler });
      return router;
    }),
    put: jest.fn((path, handler) => {
      routes.push({ method: 'put', path, handler });
      return router;
    }),
    delete: jest.fn((path, handler) => {
      routes.push({ method: 'delete', path, handler });
      return router;
    }),
  };
  return router;
};

const router = createRouter();

const service = {
  getAllFiscalBooks: jest.fn(),
  getFiscalBookStatistics: jest.fn(),
  getFiscalBookById: jest.fn(),
  getFiscalBookTransactions: jest.fn(),
  createFiscalBook: jest.fn(),
  updateFiscalBook: jest.fn(),
  deleteFiscalBook: jest.fn(),
  closeFiscalBook: jest.fn(),
  reopenFiscalBook: jest.fn(),
  addTransactionToFiscalBook: jest.fn(),
  removeTransactionFromFiscalBook: jest.fn(),
  bulkAddTransactionsToFiscalBook: jest.fn(),
};

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/fiscalBookService.js', () => service);

await import('./fiscalBookRoutes.js');

const getHandler = (method, path) =>
  router.routes.find(
    (route) => route.method === method && route.path === path
  )?.handler;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('fiscalBookRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  test('GET / builds filters and options', async () => {
    const handler = getHandler('get', '/');
    service.getAllFiscalBooks.mockResolvedValue([{ id: '1' }]);

    const req = {
      query: {
        type: 'Entrada',
        period: '2024-01',
        status: 'Aberto',
        company: 'c1',
        limit: '5',
        skip: '2',
        sort: 'createdAt',
      },
    };
    const res = createRes();

    await handler(req, res);

    expect(service.getAllFiscalBooks).toHaveBeenCalledWith(
      {
        bookType: 'Entrada',
        bookPeriod: '2024-01',
        status: 'Aberto',
        companyId: 'c1',
      },
      { limit: 5, skip: 2, sort: 'createdAt' }
    );
    expect(res.json).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('GET / returns 500 on error', async () => {
    const handler = getHandler('get', '/');
    service.getAllFiscalBooks.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('GET /statistics returns stats', async () => {
    const handler = getHandler('get', '/statistics');
    service.getFiscalBookStatistics.mockResolvedValue({ total: 2 });

    const res = createRes();
    await handler({}, res);

    expect(res.json).toHaveBeenCalledWith({ total: 2 });
  });

  test('GET /statistics returns 500 on error', async () => {
    const handler = getHandler('get', '/statistics');
    service.getFiscalBookStatistics.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('GET /:id returns book', async () => {
    const handler = getHandler('get', '/:id');
    service.getFiscalBookById.mockResolvedValue({ id: '1' });

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  test('GET /:id returns 404 when not found', async () => {
    const handler = getHandler('get', '/:id');
    service.getFiscalBookById.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const res = createRes();
    await handler({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('GET /:id returns 500 on error', async () => {
    const handler = getHandler('get', '/:id');
    service.getFiscalBookById.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('GET /:id/transactions returns transactions', async () => {
    const handler = getHandler('get', '/:id/transactions');
    service.getFiscalBookTransactions.mockResolvedValue([{ id: 't1' }]);

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.json).toHaveBeenCalledWith([{ id: 't1' }]);
  });

  test('GET /:id/transactions returns 500 on error', async () => {
    const handler = getHandler('get', '/:id/transactions');
    service.getFiscalBookTransactions.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('POST / creates a book', async () => {
    const handler = getHandler('post', '/');
    service.createFiscalBook.mockResolvedValue({ id: '1' });

    const res = createRes();
    await handler({ body: { bookName: 'Book' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  test('POST / returns 400 on validation error', async () => {
    const handler = getHandler('post', '/');
    service.createFiscalBook.mockRejectedValue(
      new Error('Invalid fiscal book data: bookName')
    );

    const res = createRes();
    await handler({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid fiscal book data: bookName',
    });
  });

  test('POST / returns 500 on error', async () => {
    const handler = getHandler('post', '/');
    service.createFiscalBook.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('PUT /:id updates book', async () => {
    const handler = getHandler('put', '/:id');
    service.updateFiscalBook.mockResolvedValue({ id: '1' });

    const res = createRes();
    await handler({ params: { id: '1' }, body: {} }, res);

    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  test('PUT /:id returns 404 when not found', async () => {
    const handler = getHandler('put', '/:id');
    service.updateFiscalBook.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const res = createRes();
    await handler({ params: { id: 'missing' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('PUT /:id returns 500 on error', async () => {
    const handler = getHandler('put', '/:id');
    service.updateFiscalBook.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ params: { id: '1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('DELETE /:id removes book', async () => {
    const handler = getHandler('delete', '/:id');
    service.deleteFiscalBook.mockResolvedValue({ id: '1' });

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book deleted',
      data: { id: '1' },
    });
  });

  test('DELETE /:id returns 404 when not found', async () => {
    const handler = getHandler('delete', '/:id');
    service.deleteFiscalBook.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const res = createRes();
    await handler({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('DELETE /:id returns 400 when has transactions', async () => {
    const handler = getHandler('delete', '/:id');
    service.deleteFiscalBook.mockRejectedValue(
      new Error('Cannot delete fiscal book with associated transactions')
    );

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot delete fiscal book with associated transactions',
    });
  });

  test('DELETE /:id returns 500 on error', async () => {
    const handler = getHandler('delete', '/:id');
    service.deleteFiscalBook.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('PUT /:id/close closes book', async () => {
    const handler = getHandler('put', '/:id/close');
    service.closeFiscalBook.mockResolvedValue({ id: '1' });

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  test('PUT /:id/close returns 404 when not found', async () => {
    const handler = getHandler('put', '/:id/close');
    service.closeFiscalBook.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const res = createRes();
    await handler({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('PUT /:id/close returns 500 on error', async () => {
    const handler = getHandler('put', '/:id/close');
    service.closeFiscalBook.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('PUT /:id/reopen reopens book', async () => {
    const handler = getHandler('put', '/:id/reopen');
    service.reopenFiscalBook.mockResolvedValue({ id: '1' });

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: '1' });
  });

  test('PUT /:id/reopen returns 404 when not found', async () => {
    const handler = getHandler('put', '/:id/reopen');
    service.reopenFiscalBook.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const res = createRes();
    await handler({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('PUT /:id/reopen returns 500 on error', async () => {
    const handler = getHandler('put', '/:id/reopen');
    service.reopenFiscalBook.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('PUT /:id/transactions/:transactionId adds transaction', async () => {
    const handler = getHandler('put', '/:id/transactions/:transactionId');
    service.addTransactionToFiscalBook.mockResolvedValue({ id: 't1' });

    const res = createRes();
    await handler(
      { params: { id: '1', transactionId: 't1' } },
      res
    );

    expect(res.json).toHaveBeenCalledWith({ id: 't1' });
  });

  test('PUT /:id/transactions/:transactionId returns 404 when missing', async () => {
    const handler = getHandler('put', '/:id/transactions/:transactionId');
    service.addTransactionToFiscalBook.mockRejectedValue(
      new Error('Transaction not found')
    );

    const res = createRes();
    await handler(
      { params: { id: '1', transactionId: 'missing' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Transaction not found',
    });
  });

  test('PUT /:id/transactions/:transactionId returns 400 on invalid link', async () => {
    const handler = getHandler('put', '/:id/transactions/:transactionId');
    service.addTransactionToFiscalBook.mockRejectedValue(
      new Error('Invalid transaction-book relationship: mismatch')
    );

    const res = createRes();
    await handler(
      { params: { id: '1', transactionId: 't1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid transaction-book relationship: mismatch',
    });
  });

  test('PUT /:id/transactions/:transactionId returns 500 on error', async () => {
    const handler = getHandler('put', '/:id/transactions/:transactionId');
    service.addTransactionToFiscalBook.mockRejectedValue(new Error('boom'));

    const res = createRes();
    await handler(
      { params: { id: '1', transactionId: 't1' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('DELETE /transactions/:transactionId removes transaction', async () => {
    const handler = getHandler('delete', '/transactions/:transactionId');
    service.removeTransactionFromFiscalBook.mockResolvedValue({ id: 't1' });

    const res = createRes();
    await handler({ params: { transactionId: 't1' } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: 't1' });
  });

  test('DELETE /transactions/:transactionId returns 404 when missing', async () => {
    const handler = getHandler('delete', '/transactions/:transactionId');
    service.removeTransactionFromFiscalBook.mockRejectedValue(
      new Error('Transaction not found')
    );

    const res = createRes();
    await handler({ params: { transactionId: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Transaction not found',
    });
  });

  test('DELETE /transactions/:transactionId returns 500 on error', async () => {
    const handler = getHandler('delete', '/transactions/:transactionId');
    service.removeTransactionFromFiscalBook.mockRejectedValue(
      new Error('boom')
    );

    const res = createRes();
    await handler({ params: { transactionId: 't1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('POST /:id/transactions validates request body', async () => {
    const handler = getHandler('post', '/:id/transactions');
    const res = createRes();

    await handler({ params: { id: '1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Transaction IDs array is required',
    });
  });

  test('POST /:id/transactions adds transactions', async () => {
    const handler = getHandler('post', '/:id/transactions');
    service.bulkAddTransactionsToFiscalBook.mockResolvedValue({ updated: 2 });

    const res = createRes();
    await handler(
      { params: { id: '1' }, body: { transactionIds: ['t1', 't2'] } },
      res
    );

    expect(res.json).toHaveBeenCalledWith({ updated: 2 });
  });

  test('POST /:id/transactions returns 404 when not found', async () => {
    const handler = getHandler('post', '/:id/transactions');
    service.bulkAddTransactionsToFiscalBook.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const res = createRes();
    await handler(
      { params: { id: 'missing' }, body: { transactionIds: ['t1'] } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('POST /:id/transactions returns 500 on error', async () => {
    const handler = getHandler('post', '/:id/transactions');
    service.bulkAddTransactionsToFiscalBook.mockRejectedValue(
      new Error('boom')
    );

    const res = createRes();
    await handler(
      { params: { id: '1' }, body: { transactionIds: ['t1'] } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });
});

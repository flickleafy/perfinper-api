import { jest } from '@jest/globals';

const createRouter = () => {
  const routes = [];
  const router = {
    routes,
    get: jest.fn((path, handler) => {
      routes.push({ method: 'get', path, handler });
      return router;
    }),
  };
  return router;
};

const router = createRouter();

const transactionsExporterService = jest.fn();
const exportFiscalBookToCSV = jest.fn();
const exportFiscalBookToJSON = jest.fn();

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/exportService.js', () => ({
  transactionsExporterService,
}));

jest.unstable_mockModule('../services/exporter/fiscalBookExporter.js', () => ({
  exportFiscalBookToCSV,
  exportFiscalBookToJSON,
}));

await import('./exportRoutes.js');

const getHandler = (method, path) =>
  router.routes.find(
    (route) => route.method === method && route.path === path
  )?.handler;

const createRes = () => {
  const res = {};
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('exportRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers export routes', () => {
    const map = Object.fromEntries(
      router.routes.map((route) => [
        `${route.method} ${route.path}`,
        route.handler,
      ])
    );
    expect(map['get /transactions/:year']).toBe(transactionsExporterService);
    expect(map['get /fiscal-book/:id/csv']).toEqual(expect.any(Function));
    expect(map['get /fiscal-book/:id/json']).toEqual(expect.any(Function));
  });

  test('exports fiscal book to CSV with transactions by default', async () => {
    const handler = getHandler('get', '/fiscal-book/:id/csv');
    exportFiscalBookToCSV.mockResolvedValue({
      csv: 'data',
      filename: 'book.csv',
    });

    const req = { params: { id: 'fb1' }, query: {} };
    const res = createRes();

    await handler(req, res);

    expect(exportFiscalBookToCSV).toHaveBeenCalledWith('fb1', true);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="book.csv"'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('data');
  });

  test('exports fiscal book to CSV without transactions', async () => {
    const handler = getHandler('get', '/fiscal-book/:id/csv');
    exportFiscalBookToCSV.mockResolvedValue({
      csv: 'data',
      filename: 'book.csv',
    });

    const req = { params: { id: 'fb1' }, query: { transactions: 'false' } };
    const res = createRes();

    await handler(req, res);

    expect(exportFiscalBookToCSV).toHaveBeenCalledWith('fb1', false);
  });

  test('CSV export returns 404 when fiscal book missing', async () => {
    const handler = getHandler('get', '/fiscal-book/:id/csv');
    exportFiscalBookToCSV.mockRejectedValue(
      new Error('Fiscal book not found')
    );

    const req = { params: { id: 'missing' }, query: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fiscal book not found' });
  });

  test('CSV export returns 500 on error', async () => {
    const handler = getHandler('get', '/fiscal-book/:id/csv');
    exportFiscalBookToCSV.mockRejectedValue(new Error('boom'));

    const req = { params: { id: 'fb1' }, query: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });

  test('exports fiscal book to JSON and handles not found', async () => {
    const handler = getHandler('get', '/fiscal-book/:id/json');
    exportFiscalBookToJSON
      .mockResolvedValueOnce({ json: { ok: true }, filename: 'book.json' })
      .mockRejectedValueOnce(new Error('Fiscal book not found'));

    const req = { params: { id: 'fb1' }, query: {} };
    const res = createRes();

    await handler(req, res);

    expect(exportFiscalBookToJSON).toHaveBeenCalledWith('fb1', true);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="book.json"'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    const resNotFound = createRes();
    await handler({ params: { id: 'missing' }, query: {} }, resNotFound);

    expect(resNotFound.status).toHaveBeenCalledWith(404);
    expect(resNotFound.json).toHaveBeenCalledWith({
      message: 'Fiscal book not found',
    });
  });

  test('JSON export returns 500 on error', async () => {
    const handler = getHandler('get', '/fiscal-book/:id/json');
    exportFiscalBookToJSON.mockRejectedValue(new Error('boom'));

    const req = { params: { id: 'fb1' }, query: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'boom',
    });
  });
});

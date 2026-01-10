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
  insertTransaction: jest.fn(),
  findTransactionById: jest.fn(),
  updateTransactionById: jest.fn(),
  deleteTransactionById: jest.fn(),
  separateTransactionById: jest.fn(),
  findAllTransactionsInPeriod: jest.fn(),
  removeAllTransactionsInPeriod: jest.fn(),
  findUniquePeriods: jest.fn(),
  findUniqueYears: jest.fn(),
  getTransactionsByFiscalBookId: jest.fn(),
  assignTransactionsToFiscalBook: jest.fn(),
  removeTransactionsFromFiscalBook: jest.fn(),
  updateTransactionFiscalBook: jest.fn(),
};

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/transactionService.js', () => service);

await import('./transactionRoutes.js');

const routeMap = Object.fromEntries(
  router.routes.map((route) => [`${route.method} ${route.path}`, route.handler])
);

describe('transactionRoutes', () => {
  test('registers transaction routes', () => {
    expect(routeMap['post /']).toBe(service.insertTransaction);
    expect(routeMap['get /:id']).toBe(service.findTransactionById);
    expect(routeMap['put /:id']).toBe(service.updateTransactionById);
    expect(routeMap['delete /:id']).toBe(service.deleteTransactionById);
    expect(routeMap['post /separate/:id']).toBe(service.separateTransactionById);
    expect(routeMap['get /period/:transactionPeriod']).toBe(
      service.findAllTransactionsInPeriod
    );
    expect(routeMap['delete /period/:transactionPeriod']).toBe(
      service.removeAllTransactionsInPeriod
    );
    expect(routeMap['post /periods']).toBe(service.findUniquePeriods);
    expect(routeMap['post /years']).toBe(service.findUniqueYears);
    expect(routeMap['get /fiscalBook/:fiscalBookId']).toBe(
      service.getTransactionsByFiscalBookId
    );
    expect(routeMap['post /fiscalBook/assign']).toBe(
      service.assignTransactionsToFiscalBook
    );
    expect(routeMap['delete /fiscalBook/:fiscalBookId']).toBe(
      service.removeTransactionsFromFiscalBook
    );
    expect(routeMap['put /:id/fiscalBook']).toBe(
      service.updateTransactionFiscalBook
    );
  });
});

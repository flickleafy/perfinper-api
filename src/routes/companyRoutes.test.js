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
  findAllCompanies: jest.fn(),
  findCompanyById: jest.fn(),
  findCompanyByCnpj: jest.fn(),
  findCompaniesByName: jest.fn(),
  findCompaniesByStatus: jest.fn(),
  findCompaniesByCity: jest.fn(),
  findCompaniesByState: jest.fn(),
  findCompaniesByPrimaryActivityCode: jest.fn(),
  findCompaniesBySecondaryActivityCode: jest.fn(),
  findCompaniesByType: jest.fn(),
  createCompany: jest.fn(),
  updateCompanyById: jest.fn(),
  updateCompanyByCnpj: jest.fn(),
  upsertCompanyByCnpj: jest.fn(),
  deleteCompanyById: jest.fn(),
  deleteCompanyByCnpj: jest.fn(),
  deleteCompaniesByIds: jest.fn(),
  getOverallCompanyStatistics: jest.fn(),
  findUniqueStates: jest.fn(),
  findUniqueCities: jest.fn(),
  findUniqueCompanyTypes: jest.fn(),
  findCompaniesWithoutCnpj: jest.fn(),
  updateCompanyStatistics: jest.fn(),
};

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/companyService.js', () => service);

await import('./companyRoutes.js');

const routeMap = Object.fromEntries(
  router.routes.map((route) => [`${route.method} ${route.path}`, route.handler])
);

describe('companyRoutes', () => {
  test('registers company routes', () => {
    expect(routeMap['get /']).toBe(service.findAllCompanies);
    expect(routeMap['get /statistics']).toBe(service.getOverallCompanyStatistics);
    expect(routeMap['get /cnpj/:cnpj']).toBe(service.findCompanyByCnpj);
    expect(routeMap['get /name/:name']).toBe(service.findCompaniesByName);
    expect(routeMap['get /status/:status']).toBe(service.findCompaniesByStatus);
    expect(routeMap['get /city/:city']).toBe(service.findCompaniesByCity);
    expect(routeMap['get /state/:state']).toBe(service.findCompaniesByState);
    expect(routeMap['get /type/:type']).toBe(service.findCompaniesByType);
    expect(routeMap['get /activity/primary/:activityCode']).toBe(
      service.findCompaniesByPrimaryActivityCode
    );
    expect(routeMap['get /activity/secondary/:activityCode']).toBe(
      service.findCompaniesBySecondaryActivityCode
    );
    expect(routeMap['get /meta/states']).toBe(service.findUniqueStates);
    expect(routeMap['get /meta/cities']).toBe(service.findUniqueCities);
    expect(routeMap['get /meta/types']).toBe(service.findUniqueCompanyTypes);
    expect(routeMap['get /query/without-cnpj']).toBe(
      service.findCompaniesWithoutCnpj
    );
    expect(routeMap['get /:id']).toBe(service.findCompanyById);
    expect(routeMap['post /']).toBe(service.createCompany);
    expect(routeMap['post /upsert/cnpj/:cnpj']).toBe(service.upsertCompanyByCnpj);
    expect(routeMap['post /delete/batch']).toBe(service.deleteCompaniesByIds);
    expect(routeMap['put /:id']).toBe(service.updateCompanyById);
    expect(routeMap['put /cnpj/:cnpj']).toBe(service.updateCompanyByCnpj);
    expect(routeMap['put /statistics/cnpj/:cnpj']).toBe(
      service.updateCompanyStatistics
    );
    expect(routeMap['delete /:id']).toBe(service.deleteCompanyById);
    expect(routeMap['delete /cnpj/:cnpj']).toBe(service.deleteCompanyByCnpj);
  });
});

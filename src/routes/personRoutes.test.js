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
  insertPerson: jest.fn(),
  findPersonById: jest.fn(),
  findPersonByCpf: jest.fn(),
  findPeopleByName: jest.fn(),
  findPeopleByStatus: jest.fn(),
  findPeopleByCity: jest.fn(),
  findAllPeople: jest.fn(),
  updatePersonById: jest.fn(),
  updatePersonByCpf: jest.fn(),
  deletePersonById: jest.fn(),
  getPersonStatistics: jest.fn(),
  getPersonCount: jest.fn(),
  findPeopleByBusinessType: jest.fn(),
  findPeopleByBusinessCategory: jest.fn(),
  findPeopleWithPersonalBusiness: jest.fn(),
  findPeopleFormalizedBusinesses: jest.fn(),
  findPeopleInformalBusinesses: jest.fn(),
  getPersonDistinctBusinessTypes: jest.fn(),
  getPersonDistinctBusinessCategories: jest.fn(),
};

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/personService.js', () => service);

await import('./personRoutes.js');

const routeMap = Object.fromEntries(
  router.routes.map((route) => [`${route.method} ${route.path}`, route.handler])
);

describe('personRoutes', () => {
  test('registers person routes', () => {
    expect(routeMap['post /']).toBe(service.insertPerson);
    expect(routeMap['get /']).toBe(service.findAllPeople);
    expect(routeMap['get /count']).toBe(service.getPersonCount);
    expect(routeMap['get /statistics']).toBe(service.getPersonStatistics);
    expect(routeMap['get /id/:id']).toBe(service.findPersonById);
    expect(routeMap['get /cpf/:cpf']).toBe(service.findPersonByCpf);
    expect(routeMap['get /name/:name']).toBe(service.findPeopleByName);
    expect(routeMap['get /status/:status']).toBe(service.findPeopleByStatus);
    expect(routeMap['get /city/:city']).toBe(service.findPeopleByCity);
    expect(routeMap['get /business/all']).toBe(
      service.findPeopleWithPersonalBusiness
    );
    expect(routeMap['get /business/formalized']).toBe(
      service.findPeopleFormalizedBusinesses
    );
    expect(routeMap['get /business/informal']).toBe(
      service.findPeopleInformalBusinesses
    );
    expect(routeMap['get /business/type/:businessType']).toBe(
      service.findPeopleByBusinessType
    );
    expect(routeMap['get /business/category/:businessCategory']).toBe(
      service.findPeopleByBusinessCategory
    );
    expect(routeMap['get /business/types/distinct']).toBe(
      service.getPersonDistinctBusinessTypes
    );
    expect(routeMap['get /business/categories/distinct']).toBe(
      service.getPersonDistinctBusinessCategories
    );
    expect(routeMap['put /id/:id']).toBe(service.updatePersonById);
    expect(routeMap['put /cpf/:cpf']).toBe(service.updatePersonByCpf);
    expect(routeMap['delete /id/:id']).toBe(service.deletePersonById);
  });
});

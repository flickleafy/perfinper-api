import { jest } from '@jest/globals';

const createRouter = () => {
  const routes = [];
  const router = {
    routes,
    post: jest.fn((path, handler) => {
      routes.push({ method: 'post', path, handler });
      return router;
    }),
  };
  return router;
};

const router = createRouter();

const service = {
  nubankImporter: jest.fn(),
  flashImporter: jest.fn(),
  mercadolivreImporter: jest.fn(),
  nubankCreditImporter: jest.fn(),
  digioCreditImporter: jest.fn(),
};

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/importService.js', () => service);

await import('./importRoutes.js');

const routeMap = Object.fromEntries(
  router.routes.map((route) => [`${route.method} ${route.path}`, route.handler])
);

describe('importRoutes', () => {
  test('registers import routes', () => {
    expect(routeMap['post /nubank']).toBe(service.nubankImporter);
    expect(routeMap['post /nubank-credit']).toBe(service.nubankCreditImporter);
    expect(routeMap['post /digio-credit']).toBe(service.digioCreditImporter);
    expect(routeMap['post /flash']).toBe(service.flashImporter);
    expect(routeMap['post /mercadolivre']).toBe(service.mercadolivreImporter);
  });
});

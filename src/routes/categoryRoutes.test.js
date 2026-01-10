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

const deleteCategoryById = jest.fn();
const findAllCategories = jest.fn();
const findCategoryById = jest.fn();
const insertCategory = jest.fn();
const updateCategoryById = jest.fn();

jest.unstable_mockModule('express', () => ({
  default: { Router: () => router },
}));

jest.unstable_mockModule('../services/categoryService.js', () => ({
  deleteCategoryById,
  findAllCategories,
  findCategoryById,
  insertCategory,
  updateCategoryById,
}));

await import('./categoryRoutes.js');

const routeMap = Object.fromEntries(
  router.routes.map((route) => [`${route.method} ${route.path}`, route.handler])
);

describe('categoryRoutes', () => {
  test('registers category routes', () => {
    expect(routeMap['post /']).toBe(insertCategory);
    expect(routeMap['get /:id']).toBe(findCategoryById);
    expect(routeMap['put /:id']).toBe(updateCategoryById);
    expect(routeMap['delete /:id']).toBe(deleteCategoryById);
    expect(routeMap['get /all/itens']).toBe(findAllCategories);
  });
});

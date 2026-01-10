import { jest } from '@jest/globals';

const findAll = jest.fn();
const insert = jest.fn();

jest.unstable_mockModule('../repository/categoryRepository.js', () => ({
  findAll,
  insert,
}));

const { initializeDatabase } = await import('./initializationService.js');

describe('initializationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes default categories when none exist', async () => {
    findAll.mockResolvedValue([]);

    await initializeDatabase();

    expect(insert).toHaveBeenCalledTimes(6);
    expect(insert).toHaveBeenCalledWith({
      name: 'Mercado',
      iconName: 'LocalGroceryStoreIcon',
    });
    expect(insert).toHaveBeenCalledWith({
      name: 'Receita',
      iconName: 'AttachMoneyIcon',
    });
  });

  test('does not insert defaults when categories exist', async () => {
    findAll.mockResolvedValue([{ id: 'c1' }]);

    await initializeDatabase();

    expect(insert).not.toHaveBeenCalled();
  });
});

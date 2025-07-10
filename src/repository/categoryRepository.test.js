import { jest } from '@jest/globals';

const CategoryModel = jest.fn(function (data) {
  this.data = data;
  this.save = jest.fn().mockResolvedValue(this);
  return this;
});

CategoryModel.find = jest.fn();
CategoryModel.findByIdAndDelete = jest.fn();
CategoryModel.findByIdAndUpdate = jest.fn();
CategoryModel.findById = jest.fn();

jest.unstable_mockModule('../models/CategoryModel.js', () => ({
  default: CategoryModel,
}));

const {
  findAll,
  deleteById,
  updateById,
  findById,
  insert,
} = await import('./categoryRepository.js');

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('categoryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  test('findAll returns sorted categories', async () => {
    const sort = jest.fn().mockResolvedValue([{ name: 'Food' }]);
    CategoryModel.find.mockReturnValue({ sort });

    const result = await findAll();

    expect(CategoryModel.find).toHaveBeenCalledWith({});
    expect(sort).toHaveBeenCalledWith({ name: 1 });
    expect(result).toEqual([{ name: 'Food' }]);
  });

  test('findAll throws on error', async () => {
    CategoryModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAll()).rejects.toThrow('Failed to retrieve categories.');
  });

  test('deleteById returns deleted category', async () => {
    CategoryModel.findByIdAndDelete.mockResolvedValue({ id: '1' });

    const result = await deleteById('1');

    expect(CategoryModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });

  test('deleteById throws when category missing', async () => {
    CategoryModel.findByIdAndDelete.mockResolvedValue(null);

    await expect(deleteById('missing')).rejects.toThrow(
      'Failed to delete category.'
    );
  });

  test('updateById returns updated category', async () => {
    CategoryModel.findByIdAndUpdate.mockResolvedValue({ id: '1', name: 'New' });

    const result = await updateById('1', { name: 'New' });

    expect(CategoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { name: 'New' },
      { new: true }
    );
    expect(result).toEqual({ id: '1', name: 'New' });
  });

  test('updateById throws when category missing', async () => {
    CategoryModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(updateById('missing', {})).rejects.toThrow(
      'Failed to update category.'
    );
  });

  test('findById returns category', async () => {
    CategoryModel.findById.mockResolvedValue({ id: '1' });

    const result = await findById('1');

    expect(CategoryModel.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });

  test('findById throws when category missing', async () => {
    CategoryModel.findById.mockResolvedValue(null);

    await expect(findById('missing')).rejects.toThrow(
      'Failed to find category.'
    );
  });

  test('insert saves new category', async () => {
    const result = await insert({ name: 'Travel' });

    expect(CategoryModel).toHaveBeenCalledWith({ name: 'Travel' });
    const instance = CategoryModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(instance);
  });

  test('insert throws on save error', async () => {
    const instance = {
      save: jest.fn().mockRejectedValue(new Error('save fail')),
    };
    CategoryModel.mockImplementationOnce(() => instance);

    await expect(insert({ name: 'Bad' })).rejects.toThrow(
      'Failed to insert new category.'
    );
  });
});

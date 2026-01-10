import { jest } from '@jest/globals';

const insert = jest.fn();
const findById = jest.fn();
const updateById = jest.fn();
const deleteById = jest.fn();
const findAll = jest.fn();

const categoryPrototype = jest.fn((body) => ({
  name: body?.name,
  iconName: body?.iconName,
}));
const logger = { error: jest.fn(), info: jest.fn() };

jest.unstable_mockModule('../config/logger.js', () => ({
  default: logger,
}));

jest.unstable_mockModule('../repository/categoryRepository.js', () => ({
  insert,
  findById,
  updateById,
  deleteById,
  findAll,
}));

jest.unstable_mockModule('./prototype/categoryPrototype.js', () => ({
  categoryPrototype,
}));

const {
  insertCategory,
  findCategoryById,
  updateCategoryById,
  deleteCategoryById,
  findAllCategories,
} = await import('./categoryService.js');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('categoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('insertCategory creates category', async () => {
    insert.mockResolvedValue({ id: '1' });
    const res = createRes();

    await insertCategory({ body: { name: 'Food', iconName: 'icon' } }, res);

    expect(categoryPrototype).toHaveBeenCalledWith({
      name: 'Food',
      iconName: 'icon',
    });
    expect(insert).toHaveBeenCalledWith({ name: 'Food', iconName: 'icon' });
    expect(res.send).toHaveBeenCalledWith({ id: '1' });
  });

  test('insertCategory handles errors', async () => {
    insert.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await insertCategory({ body: { name: 'Food' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'fail' })
    );
  });

  test('insertCategory uses fallback message when error has no message', async () => {
    insert.mockRejectedValue({});
    const res = createRes();

    await insertCategory({ body: { name: 'Food' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Algum erro ocorreu ao salvar category',
      })
    );
  });

  test('findCategoryById returns category', async () => {
    findById.mockResolvedValue({ id: '1' });
    const res = createRes();

    await findCategoryById({ params: { id: '1' } }, res);

    expect(findById).toHaveBeenCalledWith('1');
    expect(res.send).toHaveBeenCalledWith({ id: '1' });
  });

  test('findCategoryById returns 404 when missing', async () => {
    findById.mockResolvedValue(null);
    const res = createRes();

    await findCategoryById({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('findCategoryById handles errors', async () => {
    findById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCategoryById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCategoryById uses fallback message when error has no message', async () => {
    findById.mockRejectedValue({});
    const res = createRes();

    await findCategoryById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Erro ao listar a category' })
    );
  });

  test('updateCategoryById validates body', async () => {
    const res = createRes();

    await updateCategoryById({ params: { id: '1' }, body: null }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCategoryById updates category', async () => {
    updateById.mockResolvedValue({ id: '1' });
    const res = createRes();

    await updateCategoryById(
      { params: { id: '1' }, body: { name: 'Food' } },
      res
    );

    expect(categoryPrototype).toHaveBeenCalledWith({ name: 'Food' });
    expect(updateById).toHaveBeenCalledWith('1', { name: 'Food' });
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateCategoryById returns 404 when missing', async () => {
    updateById.mockResolvedValue(null);
    const res = createRes();

    await updateCategoryById(
      { params: { id: '1' }, body: { name: 'Food' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateCategoryById handles errors', async () => {
    updateById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updateCategoryById(
      { params: { id: '1' }, body: { name: 'Food' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteCategoryById deletes category', async () => {
    deleteById.mockResolvedValue({ id: '1' });
    const res = createRes();

    await deleteCategoryById({ params: { id: '1' } }, res);

    expect(deleteById).toHaveBeenCalledWith('1');
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('deleteCategoryById returns 404 when missing', async () => {
    deleteById.mockResolvedValue(null);
    const res = createRes();

    await deleteCategoryById({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteCategoryById handles errors', async () => {
    deleteById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await deleteCategoryById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findAllCategories returns categories', async () => {
    findAll.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findAllCategories({}, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findAllCategories handles errors', async () => {
    findAll.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findAllCategories({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

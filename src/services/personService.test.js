import { jest } from '@jest/globals';

const repository = {
  insert: jest.fn(),
  findById: jest.fn(),
  findByCpf: jest.fn(),
  findByName: jest.fn(),
  findByStatus: jest.fn(),
  findByCity: jest.fn(),
  findByBusinessType: jest.fn(),
  findByBusinessCategory: jest.fn(),
  findWithPersonalBusiness: jest.fn(),
  findFormalizedBusinesses: jest.fn(),
  findInformalBusinesses: jest.fn(),
  getDistinctBusinessTypes: jest.fn(),
  getDistinctBusinessCategories: jest.fn(),
  findAll: jest.fn(),
  updateById: jest.fn(),
  updateByCpf: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn(),
  getStatistics: jest.fn(),
};

const logger = { error: jest.fn() };

jest.unstable_mockModule('../config/logger.js', () => ({
  default: logger,
}));

jest.unstable_mockModule('../repository/personRepository.js', () => ({
  ...repository,
}));

const service = await import('./personService.js');
const {
  insertPerson,
  findPersonById,
  findPersonByCpf,
  findPeopleByName,
  findPeopleByStatus,
  findPeopleByCity,
  findAllPeople,
  updatePersonById,
  updatePersonByCpf,
  deletePersonById,
  getPersonStatistics,
  getPersonCount,
  findPeopleByBusinessType,
  findPeopleByBusinessCategory,
  findPeopleWithPersonalBusiness,
  findPeopleFormalizedBusinesses,
  findPeopleInformalBusinesses,
  getPersonDistinctBusinessTypes,
  getPersonDistinctBusinessCategories,
} = service;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('personService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('insertPerson creates person', async () => {
    repository.insert.mockResolvedValue({ id: 'p1' });
    const res = createRes();

    await insertPerson({ body: { name: 'Ana' } }, res);

    expect(repository.insert).toHaveBeenCalledWith({ name: 'Ana' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ id: 'p1' });
  });

  test('insertPerson handles errors', async () => {
    repository.insert.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await insertPerson({ body: { name: 'Ana' } }, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'fail' })
    );
  });

  test('findPersonById returns person', async () => {
    repository.findById.mockResolvedValue({ id: 'p1' });
    const res = createRes();

    await findPersonById({ params: { id: 'p1' } }, res);

    expect(repository.findById).toHaveBeenCalledWith('p1');
    expect(res.send).toHaveBeenCalledWith({ id: 'p1' });
  });

  test('findPersonById returns 404 when missing', async () => {
    repository.findById.mockResolvedValue(null);
    const res = createRes();

    await findPersonById({ params: { id: 'p1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('findPersonById handles errors', async () => {
    repository.findById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findPersonById({ params: { id: 'p1' } }, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findPersonByCpf returns person', async () => {
    repository.findByCpf.mockResolvedValue({ id: 'p1' });
    const res = createRes();

    await findPersonByCpf({ params: { cpf: '123' } }, res);

    expect(repository.findByCpf).toHaveBeenCalledWith('123');
    expect(res.send).toHaveBeenCalledWith({ id: 'p1' });
  });

  test('findPersonByCpf returns 404 when missing', async () => {
    repository.findByCpf.mockResolvedValue(null);
    const res = createRes();

    await findPersonByCpf({ params: { cpf: '123' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('findPersonByCpf handles errors', async () => {
    repository.findByCpf.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findPersonByCpf({ params: { cpf: '123' } }, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  describe.each([
    [
      'findPeopleByName',
      findPeopleByName,
      repository.findByName,
      { params: { name: 'Ana' } },
    ],
    [
      'findPeopleByStatus',
      findPeopleByStatus,
      repository.findByStatus,
      { params: { status: 'active' } },
    ],
    [
      'findPeopleByCity',
      findPeopleByCity,
      repository.findByCity,
      { params: { city: 'X' } },
    ],
    ['findAllPeople', findAllPeople, repository.findAll, {}],
    [
      'findPeopleByBusinessType',
      findPeopleByBusinessType,
      repository.findByBusinessType,
      { params: { businessType: 'mei' } },
    ],
    [
      'findPeopleByBusinessCategory',
      findPeopleByBusinessCategory,
      repository.findByBusinessCategory,
      { params: { businessCategory: 'food' } },
    ],
    [
      'findPeopleWithPersonalBusiness',
      findPeopleWithPersonalBusiness,
      repository.findWithPersonalBusiness,
      {},
    ],
    [
      'findPeopleFormalizedBusinesses',
      findPeopleFormalizedBusinesses,
      repository.findFormalizedBusinesses,
      {},
    ],
    [
      'findPeopleInformalBusinesses',
      findPeopleInformalBusinesses,
      repository.findInformalBusinesses,
      {},
    ],
    [
      'getPersonDistinctBusinessTypes',
      getPersonDistinctBusinessTypes,
      repository.getDistinctBusinessTypes,
      {},
    ],
    [
      'getPersonDistinctBusinessCategories',
      getPersonDistinctBusinessCategories,
      repository.getDistinctBusinessCategories,
      {},
    ],
  ])('%s', (label, handler, repoFn, req) => {
    test('returns data', async () => {
      repoFn.mockResolvedValue([{ id: 'p1' }]);
      const res = createRes();

      await handler(req, res);

      expect(res.send).toHaveBeenCalledWith([{ id: 'p1' }]);
    });

    test('handles errors', async () => {
      repoFn.mockRejectedValue(new Error('fail'));
      const res = createRes();

      await handler(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  test('updatePersonById updates person', async () => {
    repository.updateById.mockResolvedValue({ id: 'p1' });
    const res = createRes();

    await updatePersonById({ params: { id: 'p1' }, body: { name: 'Ana' } }, res);

    expect(res.send).toHaveBeenCalledWith({ id: 'p1' });
  });

  test('updatePersonById returns 404 when missing', async () => {
    repository.updateById.mockResolvedValue(null);
    const res = createRes();

    await updatePersonById({ params: { id: 'p1' }, body: { name: 'Ana' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updatePersonById handles errors', async () => {
    repository.updateById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updatePersonById({ params: { id: 'p1' }, body: { name: 'Ana' } }, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updatePersonByCpf updates person', async () => {
    repository.updateByCpf.mockResolvedValue({ id: 'p1' });
    const res = createRes();

    await updatePersonByCpf({ params: { cpf: '123' }, body: { name: 'Ana' } }, res);

    expect(res.send).toHaveBeenCalledWith({ id: 'p1' });
  });

  test('updatePersonByCpf returns 404 when missing', async () => {
    repository.updateByCpf.mockResolvedValue(null);
    const res = createRes();

    await updatePersonByCpf({ params: { cpf: '123' }, body: { name: 'Ana' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updatePersonByCpf handles errors', async () => {
    repository.updateByCpf.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updatePersonByCpf({ params: { cpf: '123' }, body: { name: 'Ana' } }, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deletePersonById deletes person', async () => {
    repository.deleteById.mockResolvedValue({ id: 'p1' });
    const res = createRes();

    await deletePersonById({ params: { id: 'p1' } }, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String), person: { id: 'p1' } })
    );
  });

  test('deletePersonById returns 404 when missing', async () => {
    repository.deleteById.mockResolvedValue(null);
    const res = createRes();

    await deletePersonById({ params: { id: 'p1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deletePersonById handles errors', async () => {
    repository.deleteById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await deletePersonById({ params: { id: 'p1' } }, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getPersonStatistics returns statistics', async () => {
    repository.getStatistics.mockResolvedValue({ total: 1 });
    const res = createRes();

    await getPersonStatistics({}, res);

    expect(res.send).toHaveBeenCalledWith({ total: 1 });
  });

  test('getPersonStatistics handles errors', async () => {
    repository.getStatistics.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await getPersonStatistics({}, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getPersonCount returns count', async () => {
    repository.count.mockResolvedValue(7);
    const res = createRes();

    await getPersonCount({}, res);

    expect(res.send).toHaveBeenCalledWith({ count: 7 });
  });

  test('getPersonCount handles errors', async () => {
    repository.count.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await getPersonCount({}, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

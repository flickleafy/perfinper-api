import { jest } from '@jest/globals';

const PersonModel = jest.fn(function (data) {
  this.data = data;
  this.save = jest.fn().mockResolvedValue(this);
  return this;
});

PersonModel.find = jest.fn();
PersonModel.findById = jest.fn();
PersonModel.findOne = jest.fn();
PersonModel.findByIdAndUpdate = jest.fn();
PersonModel.findOneAndUpdate = jest.fn();
PersonModel.findByIdAndDelete = jest.fn();
PersonModel.countDocuments = jest.fn();
PersonModel.distinct = jest.fn();
PersonModel.aggregate = jest.fn();

jest.unstable_mockModule('../models/PersonModel.js', () => ({
  default: PersonModel,
}));

const repository = await import('./personRepository.js');
const {
  findAll,
  findById,
  findByCpf,
  findByName,
  findByCity,
  findByStatus,
  findByBusinessType,
  findByBusinessCategory,
  findWithPersonalBusiness,
  findFormalizedBusinesses,
  findInformalBusinesses,
  getDistinctBusinessTypes,
  getDistinctBusinessCategories,
  insert,
  updateById,
  updateByCpf,
  deleteById,
  count,
  getStatistics,
} = repository;

const makeQuery = (result) => {
  const query = {
    session: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

const makeExecQuery = (result) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result),
});

describe('personRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findAll applies filters and options', async () => {
    const query = makeQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findAll(
      { status: 'active' },
      { limit: 3, skip: 1, sort: { fullName: 1 } },
      session
    );

    expect(PersonModel.find).toHaveBeenCalledWith({ status: 'active' });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(query.skip).toHaveBeenCalledWith(1);
    expect(query.sort).toHaveBeenCalledWith({ fullName: 1 });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findById supports session', async () => {
    const query = makeExecQuery({ id: '1' });
    PersonModel.findById.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findById('1', session);

    expect(PersonModel.findById).toHaveBeenCalledWith('1');
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ id: '1' });
  });

  test('findByCpf supports session', async () => {
    const query = makeExecQuery({ id: '1' });
    PersonModel.findOne.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByCpf('123', session);

    expect(PersonModel.findOne).toHaveBeenCalledWith({ cpf: '123' });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ id: '1' });
  });

  test('findByName supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByName('Ana', session);

    expect(PersonModel.find).toHaveBeenCalledWith({
      fullName: { $regex: 'Ana', $options: 'i' },
    });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByCity supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByCity('Austin', session);

    expect(PersonModel.find).toHaveBeenCalledWith({
      'address.city': { $regex: 'Austin', $options: 'i' },
    });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('insert saves person with session', async () => {
    const session = { id: 's' };
    const result = await insert({ fullName: 'Ana' }, session);

    const instance = PersonModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith({ session });
    expect(result).toBe(instance);
  });

  test('insert saves person without session', async () => {
    const result = await insert({ fullName: 'Sam' });

    const instance = PersonModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith();
    expect(result).toBe(instance);
  });

  test('updateById uses validators and session', async () => {
    PersonModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await updateById('1', { status: 'active' }, session);

    expect(PersonModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { status: 'active' },
      { new: true, runValidators: true, session }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateByCpf uses validators and session', async () => {
    PersonModel.findOneAndUpdate.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await updateByCpf('123', { status: 'active' }, session);

    expect(PersonModel.findOneAndUpdate).toHaveBeenCalledWith(
      { cpf: '123' },
      { status: 'active' },
      { new: true, runValidators: true, session }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('deleteById supports session', async () => {
    PersonModel.findByIdAndDelete.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await deleteById('1', session);

    expect(PersonModel.findByIdAndDelete).toHaveBeenCalledWith('1', { session });
    expect(result).toEqual({ id: '1' });
  });

  test('count supports session', async () => {
    const query = makeExecQuery(5);
    PersonModel.countDocuments.mockReturnValue(query);

    const session = { id: 's' };
    const result = await count({ status: 'active' }, session);

    expect(PersonModel.countDocuments).toHaveBeenCalledWith({ status: 'active' });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toBe(5);
  });

  test('findByStatus returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const result = await findByStatus('active');

    expect(PersonModel.find).toHaveBeenCalledWith({ status: 'active' });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByStatus supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByStatus('active', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByBusinessType returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const result = await findByBusinessType('taxi');

    expect(PersonModel.find).toHaveBeenCalledWith({
      'personalBusiness.businessType': 'taxi',
      'personalBusiness.hasPersonalBusiness': true,
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByBusinessType supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByBusinessType('taxi', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByBusinessCategory returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const result = await findByBusinessCategory('services');

    expect(PersonModel.find).toHaveBeenCalledWith({
      'personalBusiness.businessCategory': 'services',
      'personalBusiness.hasPersonalBusiness': true,
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByBusinessCategory supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByBusinessCategory('services', session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findWithPersonalBusiness returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const result = await findWithPersonalBusiness();

    expect(PersonModel.find).toHaveBeenCalledWith({
      'personalBusiness.hasPersonalBusiness': true,
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findWithPersonalBusiness supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findWithPersonalBusiness(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findFormalizedBusinesses returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const result = await findFormalizedBusinesses();

    expect(PersonModel.find).toHaveBeenCalledWith({
      'personalBusiness.hasPersonalBusiness': true,
      'personalBusiness.isFormalized': true,
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findFormalizedBusinesses supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findFormalizedBusinesses(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findInformalBusinesses returns results', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const result = await findInformalBusinesses();

    expect(PersonModel.find).toHaveBeenCalledWith({
      'personalBusiness.hasPersonalBusiness': true,
      'personalBusiness.isFormalized': false,
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findInformalBusinesses supports session', async () => {
    const query = makeExecQuery([{ id: '1' }]);
    PersonModel.find.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findInformalBusinesses(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('getDistinctBusinessTypes returns distinct list', async () => {
    const query = makeExecQuery(['taxi']);
    PersonModel.distinct.mockReturnValue(query);

    const result = await getDistinctBusinessTypes();

    expect(PersonModel.distinct).toHaveBeenCalledWith(
      'personalBusiness.businessType',
      { 'personalBusiness.hasPersonalBusiness': true }
    );
    expect(result).toEqual(['taxi']);
  });

  test('getDistinctBusinessTypes supports session', async () => {
    const query = makeExecQuery(['taxi']);
    PersonModel.distinct.mockReturnValue(query);

    const session = { id: 's' };
    const result = await getDistinctBusinessTypes(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual(['taxi']);
  });

  test('getDistinctBusinessCategories returns distinct list', async () => {
    const query = makeExecQuery(['services']);
    PersonModel.distinct.mockReturnValue(query);

    const result = await getDistinctBusinessCategories();

    expect(PersonModel.distinct).toHaveBeenCalledWith(
      'personalBusiness.businessCategory',
      { 'personalBusiness.hasPersonalBusiness': true }
    );
    expect(result).toEqual(['services']);
  });

  test('getDistinctBusinessCategories supports session', async () => {
    const query = makeExecQuery(['services']);
    PersonModel.distinct.mockReturnValue(query);

    const session = { id: 's' };
    const result = await getDistinctBusinessCategories(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual(['services']);
  });

  test('getStatistics returns aggregate results', async () => {
    const query = makeExecQuery([
      {
        total: 2,
        active: 1,
        inactive: 0,
        blocked: 1,
        withPersonalBusiness: 1,
        formalizedBusinesses: 0,
        informalBusinesses: 1,
      },
    ]);
    PersonModel.aggregate.mockReturnValue(query);

    const result = await getStatistics();

    expect(result).toEqual({
      total: 2,
      active: 1,
      inactive: 0,
      blocked: 1,
      withPersonalBusiness: 1,
      formalizedBusinesses: 0,
      informalBusinesses: 1,
    });
  });

  test('getStatistics supports session', async () => {
    const query = makeExecQuery([
      {
        total: 1,
        active: 1,
        inactive: 0,
        blocked: 0,
        withPersonalBusiness: 0,
        formalizedBusinesses: 0,
        informalBusinesses: 0,
      },
    ]);
    PersonModel.aggregate.mockReturnValue(query);

    const session = { id: 's' };
    const result = await getStatistics(session);

    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({
      total: 1,
      active: 1,
      inactive: 0,
      blocked: 0,
      withPersonalBusiness: 0,
      formalizedBusinesses: 0,
      informalBusinesses: 0,
    });
  });

  test('getStatistics returns defaults when empty', async () => {
    const query = makeExecQuery([]);
    PersonModel.aggregate.mockReturnValue(query);

    const result = await getStatistics();

    expect(result).toEqual({
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0,
      withPersonalBusiness: 0,
      formalizedBusinesses: 0,
      informalBusinesses: 0,
    });
  });
});

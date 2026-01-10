import { jest } from '@jest/globals';

const CompanyModel = jest.fn(function (data) {
  this.data = data;
  this.save = jest.fn().mockResolvedValue(this);
  return this;
});

CompanyModel.find = jest.fn();
CompanyModel.findById = jest.fn();
CompanyModel.findOne = jest.fn();
CompanyModel.findByIdAndUpdate = jest.fn();
CompanyModel.findOneAndUpdate = jest.fn();
CompanyModel.findByIdAndDelete = jest.fn();
CompanyModel.findOneAndDelete = jest.fn();
CompanyModel.deleteMany = jest.fn();
CompanyModel.distinct = jest.fn();
CompanyModel.aggregate = jest.fn();

jest.unstable_mockModule('../models/CompanyModel.js', () => ({
  default: CompanyModel,
}));

const repository = await import('./companyRepository.js');
const {
  findAll,
  findById,
  findByCnpj,
  findByName,
  findByStatus,
  findByCity,
  findByState,
  findByCompanyType,
  insert,
  updateById,
  updateByCnpj,
  deleteById,
  deleteByCnpj,
  deleteByIds,
  findDistinctStates,
  findDistinctCities,
  findDistinctCompanyTypes,
  getCompaniesWithoutCnpj,
  updateStatistics,
  findCompaniesByPrimaryActivity,
  findCompaniesBySecondaryActivity,
  upsertByCnpj,
  getCompanyStatistics,
} = repository;

const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const makeSortQuery = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

const makeSortSelectQuery = (result) => {
  const select = jest.fn().mockResolvedValue(result);
  const sort = jest.fn().mockReturnValue({ select });
  return { sort, select };
};

describe('companyRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  test('findAll returns sorted companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findAll();

    expect(CompanyModel.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findAll throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findAll()).rejects.toThrow('Failed to retrieve all companies.');
  });

  test('findById supports session and returns company', async () => {
    CompanyModel.findById.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await findById('1', session);

    expect(CompanyModel.findById).toHaveBeenCalledWith('1', { session });
    expect(result).toEqual({ id: '1' });
  });

  test('findById returns null when missing', async () => {
    CompanyModel.findById.mockResolvedValue(null);

    const result = await findById('missing');

    expect(result).toBeNull();
  });

  test('findById throws on error', async () => {
    CompanyModel.findById.mockRejectedValue(new Error('db'));

    await expect(findById('1')).rejects.toThrow(
      'An error occurred while finding the company by ID.'
    );
  });

  test('findByCnpj supports session', async () => {
    const query = { session: jest.fn().mockResolvedValue({ id: '1' }) };
    CompanyModel.findOne.mockReturnValue(query);

    const session = { id: 's' };
    const result = await findByCnpj('123', session);

    expect(CompanyModel.findOne).toHaveBeenCalledWith({
      companyCnpj: '123',
    });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ id: '1' });
  });

  test('findByCnpj returns company without session', async () => {
    CompanyModel.findOne.mockResolvedValue({ id: '2' });

    const result = await findByCnpj('456');

    expect(CompanyModel.findOne).toHaveBeenCalledWith({
      companyCnpj: '456',
    });
    expect(result).toEqual({ id: '2' });
  });

  test('findByCnpj throws on error', async () => {
    CompanyModel.findOne.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByCnpj('123')).rejects.toThrow(
      'An error occurred while finding the company by CNPJ.'
    );
  });

  test('findByName builds case-insensitive regex', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findByName('Acme');

    const filter = CompanyModel.find.mock.calls[0][0];
    expect(filter.$or).toHaveLength(3);
    expect(filter.$or[0].companyName).toBeInstanceOf(RegExp);
    expect(filter.$or[0].companyName.flags).toContain('i');
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByName throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByName('Acme')).rejects.toThrow(
      'An error occurred while finding companies by name.'
    );
  });

  test('findByStatus returns companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findByStatus('Ativa');

    expect(CompanyModel.find).toHaveBeenCalledWith({ status: 'Ativa' });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByStatus throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByStatus('Ativa')).rejects.toThrow(
      'Failed to find companies with the specified status.'
    );
  });

  test('findByCity returns companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findByCity('Austin');

    expect(CompanyModel.find).toHaveBeenCalledWith({
      'address.city': expect.any(RegExp),
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByCity throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByCity('Austin')).rejects.toThrow(
      'Failed to find companies in the specified city.'
    );
  });

  test('findByState returns companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findByState('TX');

    expect(CompanyModel.find).toHaveBeenCalledWith({
      'address.state': expect.any(RegExp),
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByState throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByState('TX')).rejects.toThrow(
      'Failed to find companies in the specified state.'
    );
  });

  test('findByCompanyType returns companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findByCompanyType('Matriz');

    expect(CompanyModel.find).toHaveBeenCalledWith({ companyType: 'Matriz' });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findByCompanyType throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findByCompanyType('Matriz')).rejects.toThrow(
      'Failed to find companies with the specified type.'
    );
  });

  test('insert saves company with session', async () => {
    const session = { id: 's' };
    const result = await insert({ companyName: 'Acme' }, session);

    const instance = CompanyModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith({ session });
    expect(result).toBe(instance);
  });

  test('insert saves company without session', async () => {
    const result = await insert({ companyName: 'Acme No Session' });

    const instance = CompanyModel.mock.instances[0];
    expect(instance.save).toHaveBeenCalledWith();
    expect(result).toBe(instance);
  });

  test('insert throws on error', async () => {
    const instance = {
      save: jest.fn().mockRejectedValue(new Error('save fail')),
    };
    CompanyModel.mockImplementationOnce(() => instance);

    await expect(insert({ companyName: 'Bad' })).rejects.toThrow(
      'An error occurred while inserting the company.'
    );
  });

  test('updateById returns updated company', async () => {
    CompanyModel.findByIdAndUpdate.mockResolvedValue({ id: '1' });

    const result = await updateById('1', { status: 'Ativa' });

    expect(CompanyModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { status: 'Ativa' },
      { new: true }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateById returns null when missing', async () => {
    CompanyModel.findByIdAndUpdate.mockResolvedValue(null);

    const result = await updateById('missing', {});

    expect(result).toBeNull();
  });

  test('updateById throws on error', async () => {
    CompanyModel.findByIdAndUpdate.mockRejectedValue(new Error('db'));

    await expect(updateById('1', {})).rejects.toThrow(
      'An error occurred while updating the company by ID.'
    );
  });

  test('updateByCnpj returns updated company', async () => {
    CompanyModel.findOneAndUpdate.mockResolvedValue({ id: '1' });

    const result = await updateByCnpj('123', { status: 'Ativa' });

    expect(CompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
      { companyCnpj: '123' },
      { status: 'Ativa' },
      { new: true }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateByCnpj returns null when missing', async () => {
    CompanyModel.findOneAndUpdate.mockResolvedValue(null);

    const result = await updateByCnpj('missing', {});

    expect(result).toBeNull();
  });

  test('updateByCnpj throws on error', async () => {
    CompanyModel.findOneAndUpdate.mockRejectedValue(new Error('db'));

    await expect(updateByCnpj('1', {})).rejects.toThrow(
      'An error occurred while updating the company by CNPJ.'
    );
  });

  test('deleteById supports session and returns company', async () => {
    CompanyModel.findByIdAndDelete.mockResolvedValue({ id: '1' });

    const session = { id: 's' };
    const result = await deleteById('1', session);

    expect(CompanyModel.findByIdAndDelete).toHaveBeenCalledWith('1', { session });
    expect(result).toEqual({ id: '1' });
  });

  test('deleteById returns null when missing', async () => {
    CompanyModel.findByIdAndDelete.mockResolvedValue(null);

    const result = await deleteById('missing');

    expect(result).toBeNull();
  });

  test('deleteById throws on error', async () => {
    CompanyModel.findByIdAndDelete.mockRejectedValue(new Error('db'));

    await expect(deleteById('1')).rejects.toThrow(
      'An error occurred while deleting the company by ID.'
    );
  });

  test('deleteByCnpj returns company', async () => {
    CompanyModel.findOneAndDelete.mockResolvedValue({ id: '1' });

    const result = await deleteByCnpj('123');

    expect(CompanyModel.findOneAndDelete).toHaveBeenCalledWith({
      companyCnpj: '123',
    });
    expect(result).toEqual({ id: '1' });
  });

  test('deleteByCnpj returns null when missing', async () => {
    CompanyModel.findOneAndDelete.mockResolvedValue(null);

    const result = await deleteByCnpj('missing');

    expect(result).toBeNull();
  });

  test('deleteByCnpj throws on error', async () => {
    CompanyModel.findOneAndDelete.mockRejectedValue(new Error('db'));

    await expect(deleteByCnpj('1')).rejects.toThrow(
      'An error occurred while deleting the company by CNPJ.'
    );
  });

  test('deleteByIds validates input and deletes', async () => {
    CompanyModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

    const result = await deleteByIds(['1', '2']);

    expect(CompanyModel.deleteMany).toHaveBeenCalledWith({
      _id: { $in: ['1', '2'] },
    });
    expect(result).toEqual({ deletedCount: 2 });
  });

  test('deleteByIds throws on invalid input', async () => {
    await expect(deleteByIds([])).rejects.toThrow(
      'An error occurred while deleting the companies by IDs.'
    );
  });

  test('deleteByIds throws when none deleted', async () => {
    CompanyModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

    await expect(deleteByIds(['1'])).rejects.toThrow(
      'An error occurred while deleting the companies by IDs.'
    );
  });

  test('findDistinctStates returns distinct values', async () => {
    CompanyModel.distinct.mockResolvedValue(['TX']);

    const result = await findDistinctStates();

    expect(CompanyModel.distinct).toHaveBeenCalledWith('address.state');
    expect(result).toEqual(['TX']);
  });

  test('findDistinctStates throws on error', async () => {
    CompanyModel.distinct.mockRejectedValue(new Error('db'));

    await expect(findDistinctStates()).rejects.toThrow(
      'Failed to retrieve distinct states.'
    );
  });

  test('findDistinctCities returns distinct values', async () => {
    CompanyModel.distinct.mockResolvedValue(['Austin']);

    const result = await findDistinctCities();

    expect(CompanyModel.distinct).toHaveBeenCalledWith('address.city');
    expect(result).toEqual(['Austin']);
  });

  test('findDistinctCities throws on error', async () => {
    CompanyModel.distinct.mockRejectedValue(new Error('db'));

    await expect(findDistinctCities()).rejects.toThrow(
      'Failed to retrieve distinct cities.'
    );
  });

  test('findDistinctCompanyTypes returns distinct values', async () => {
    CompanyModel.distinct.mockResolvedValue(['Matriz']);

    const result = await findDistinctCompanyTypes();

    expect(CompanyModel.distinct).toHaveBeenCalledWith('companyType');
    expect(result).toEqual(['Matriz']);
  });

  test('findDistinctCompanyTypes throws on error', async () => {
    CompanyModel.distinct.mockRejectedValue(new Error('db'));

    await expect(findDistinctCompanyTypes()).rejects.toThrow(
      'Failed to retrieve distinct company types.'
    );
  });

  test('getCompaniesWithoutCnpj returns selection', async () => {
    const query = makeSortSelectQuery([{ id: '1' }]);
    CompanyModel.find.mockReturnValue(query);

    const result = await getCompaniesWithoutCnpj();

    expect(CompanyModel.find).toHaveBeenCalledWith({
      $or: [
        { companyCnpj: null },
        { companyCnpj: { $exists: false } },
        { companyCnpj: '' },
        { companyCnpj: { $type: 10 } },
      ],
    });
    expect(query.sort).toHaveBeenCalledWith({ companyName: 1 });
    expect(query.select).toHaveBeenCalledWith('_id companyName');
    expect(result).toEqual([{ id: '1' }]);
  });

  test('getCompaniesWithoutCnpj throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(getCompaniesWithoutCnpj()).rejects.toThrow(
      'An error occurred while retrieving companies without CNPJ.'
    );
  });

  test('updateStatistics returns updated company', async () => {
    CompanyModel.findOneAndUpdate.mockResolvedValue({ id: '1' });

    const result = await updateStatistics('123', { total: 1 });

    expect(CompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
      { companyCnpj: '123' },
      { statistics: { total: 1 } },
      { new: true }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('updateStatistics returns null when missing', async () => {
    CompanyModel.findOneAndUpdate.mockResolvedValue(null);

    const result = await updateStatistics('missing', {});

    expect(result).toBeNull();
  });

  test('updateStatistics throws on error', async () => {
    CompanyModel.findOneAndUpdate.mockRejectedValue(new Error('db'));

    await expect(updateStatistics('1', {})).rejects.toThrow(
      'An error occurred while updating company statistics.'
    );
  });

  test('findCompaniesByPrimaryActivity returns companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findCompaniesByPrimaryActivity('001');

    expect(CompanyModel.find).toHaveBeenCalledWith({
      'activities.primary.code': '001',
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findCompaniesByPrimaryActivity throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findCompaniesByPrimaryActivity('001')).rejects.toThrow(
      'Failed to find companies with the specified primary activity.'
    );
  });

  test('findCompaniesBySecondaryActivity returns companies', async () => {
    CompanyModel.find.mockReturnValue(makeSortQuery([{ id: '1' }]));

    const result = await findCompaniesBySecondaryActivity('002');

    expect(CompanyModel.find).toHaveBeenCalledWith({
      'activities.secondary.code': '002',
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  test('findCompaniesBySecondaryActivity throws on error', async () => {
    CompanyModel.find.mockImplementation(() => {
      throw new Error('db');
    });

    await expect(findCompaniesBySecondaryActivity('002')).rejects.toThrow(
      'Failed to find companies with the specified secondary activity.'
    );
  });

  test('upsertByCnpj returns company', async () => {
    CompanyModel.findOneAndUpdate.mockResolvedValue({ id: '1' });

    const result = await upsertByCnpj('123', { companyName: 'Acme' });

    expect(CompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
      { companyCnpj: '123' },
      { companyName: 'Acme' },
      { new: true, upsert: true, runValidators: true }
    );
    expect(result).toEqual({ id: '1' });
  });

  test('upsertByCnpj throws on error', async () => {
    CompanyModel.findOneAndUpdate.mockRejectedValue(new Error('db'));

    await expect(upsertByCnpj('1', {})).rejects.toThrow(
      'An error occurred while upserting the company by CNPJ.'
    );
  });

  test('getCompanyStatistics returns aggregate result', async () => {
    CompanyModel.aggregate.mockResolvedValue([
      {
        totalCompanies: 2,
        activeCompanies: 1,
        companiesByType: ['Matriz'],
        companiesByState: ['TX'],
      },
    ]);

    const result = await getCompanyStatistics();

    expect(result).toEqual({
      totalCompanies: 2,
      activeCompanies: 1,
      companiesByType: ['Matriz'],
      companiesByState: ['TX'],
    });
  });

  test('getCompanyStatistics returns default when empty', async () => {
    CompanyModel.aggregate.mockResolvedValue([]);

    const result = await getCompanyStatistics();

    expect(result).toEqual({
      totalCompanies: 0,
      activeCompanies: 0,
      companiesByType: [],
      companiesByState: [],
    });
  });

  test('getCompanyStatistics throws on error', async () => {
    CompanyModel.aggregate.mockRejectedValue(new Error('db'));

    await expect(getCompanyStatistics()).rejects.toThrow(
      'Failed to retrieve company statistics.'
    );
  });
});

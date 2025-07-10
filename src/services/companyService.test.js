import { jest } from '@jest/globals';

const repository = {
  insert: jest.fn(),
  findById: jest.fn(),
  findByCnpj: jest.fn(),
  findByName: jest.fn(),
  findByStatus: jest.fn(),
  findByCity: jest.fn(),
  findByState: jest.fn(),
  findByCompanyType: jest.fn(),
  findAll: jest.fn(),
  updateById: jest.fn(),
  updateByCnpj: jest.fn(),
  deleteById: jest.fn(),
  deleteByCnpj: jest.fn(),
  deleteByIds: jest.fn(),
  findDistinctStates: jest.fn(),
  findDistinctCities: jest.fn(),
  findDistinctCompanyTypes: jest.fn(),
  getCompaniesWithoutCnpj: jest.fn(),
  updateStatistics: jest.fn(),
  findCompaniesByPrimaryActivity: jest.fn(),
  findCompaniesBySecondaryActivity: jest.fn(),
  upsertByCnpj: jest.fn(),
  getCompanyStatistics: jest.fn(),
};
const logger = { error: jest.fn(), info: jest.fn() };

jest.unstable_mockModule('../config/logger.js', () => ({
  default: logger,
}));

jest.unstable_mockModule('../repository/companyRepository.js', () => ({
  ...repository,
}));

const service = await import('./companyService.js');
const {
  insertCompany,
  createCompany,
  findCompanyById,
  findCompanyByCnpj,
  findCompaniesByName,
  findCompaniesByStatus,
  findCompaniesByCity,
  findCompaniesByState,
  findCompaniesByType,
  findAllCompanies,
  updateCompanyById,
  updateCompanyByCnpj,
  upsertCompanyByCnpj,
  deleteCompanyById,
  deleteCompanyByCnpj,
  deleteCompaniesByIds,
  findUniqueStates,
  findUniqueCities,
  findUniqueCompanyTypes,
  findCompaniesWithoutCnpj,
  updateCompanyStatistics,
  findCompaniesByPrimaryActivityCode,
  findCompaniesBySecondaryActivityCode,
  getOverallCompanyStatistics,
} = service;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('companyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('insertCompany sends company', async () => {
    repository.insert.mockResolvedValue({ id: '1' });
    const res = createRes();

    await insertCompany({ body: { companyName: 'A' } }, res);

    expect(repository.insert).toHaveBeenCalledWith({ companyName: 'A' });
    expect(res.send).toHaveBeenCalledWith({ id: '1' });
  });

  test('insertCompany handles errors', async () => {
    repository.insert.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await insertCompany({ body: { companyName: 'A' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('createCompany sends 201', async () => {
    repository.insert.mockResolvedValue({ id: '1' });
    const res = createRes();

    await createCompany({ body: { companyName: 'A' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ id: '1' });
  });

  test('createCompany handles errors', async () => {
    repository.insert.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await createCompany({ body: { companyName: 'A' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompanyById returns company', async () => {
    repository.findById.mockResolvedValue({ id: '1' });
    const res = createRes();

    await findCompanyById({ params: { id: '1' } }, res);

    expect(res.send).toHaveBeenCalledWith({ id: '1' });
  });

  test('findCompanyById returns 404 when missing', async () => {
    repository.findById.mockResolvedValue(null);
    const res = createRes();

    await findCompanyById({ params: { id: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('findCompanyById handles errors', async () => {
    repository.findById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompanyById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompanyByCnpj returns company', async () => {
    repository.findByCnpj.mockResolvedValue({ id: '1' });
    const res = createRes();

    await findCompanyByCnpj({ params: { cnpj: '123' } }, res);

    expect(res.send).toHaveBeenCalledWith({ id: '1' });
  });

  test('findCompanyByCnpj returns 404 when missing', async () => {
    repository.findByCnpj.mockResolvedValue(null);
    const res = createRes();

    await findCompanyByCnpj({ params: { cnpj: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('findCompanyByCnpj handles errors', async () => {
    repository.findByCnpj.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompanyByCnpj({ params: { cnpj: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesByName returns companies', async () => {
    repository.findByName.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesByName({ params: { name: 'A' } }, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesByName handles errors', async () => {
    repository.findByName.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesByName({ params: { name: 'A' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesByStatus returns companies', async () => {
    repository.findByStatus.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesByStatus({ params: { status: 'Ativa' } }, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesByStatus handles errors', async () => {
    repository.findByStatus.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesByStatus({ params: { status: 'Ativa' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesByCity returns companies', async () => {
    repository.findByCity.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesByCity({ params: { city: 'X' } }, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesByCity handles errors', async () => {
    repository.findByCity.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesByCity({ params: { city: 'X' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesByState returns companies', async () => {
    repository.findByState.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesByState({ params: { state: 'ST' } }, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesByState handles errors', async () => {
    repository.findByState.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesByState({ params: { state: 'ST' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesByType returns companies', async () => {
    repository.findByCompanyType.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesByType({ params: { type: 'Matriz' } }, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesByType handles errors', async () => {
    repository.findByCompanyType.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesByType({ params: { type: 'Matriz' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findAllCompanies returns companies', async () => {
    repository.findAll.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findAllCompanies({}, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findAllCompanies handles errors', async () => {
    repository.findAll.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findAllCompanies({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateCompanyById validates body', async () => {
    const res = createRes();

    await updateCompanyById({ params: { id: '1' }, body: null }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCompanyById updates company', async () => {
    repository.updateById.mockResolvedValue({ id: '1' });
    const res = createRes();

    await updateCompanyById(
      { params: { id: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateCompanyById returns 404 when missing', async () => {
    repository.updateById.mockResolvedValue(null);
    const res = createRes();

    await updateCompanyById(
      { params: { id: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateCompanyById handles errors', async () => {
    repository.updateById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updateCompanyById(
      { params: { id: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateCompanyByCnpj validates body', async () => {
    const res = createRes();

    await updateCompanyByCnpj({ params: { cnpj: '1' }, body: null }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCompanyByCnpj updates company', async () => {
    repository.updateByCnpj.mockResolvedValue({ id: '1' });
    const res = createRes();

    await updateCompanyByCnpj(
      { params: { cnpj: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateCompanyByCnpj returns 404 when missing', async () => {
    repository.updateByCnpj.mockResolvedValue(null);
    const res = createRes();

    await updateCompanyByCnpj(
      { params: { cnpj: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateCompanyByCnpj handles errors', async () => {
    repository.updateByCnpj.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updateCompanyByCnpj(
      { params: { cnpj: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('upsertCompanyByCnpj returns company', async () => {
    repository.upsertByCnpj.mockResolvedValue({ id: '1' });
    const res = createRes();

    await upsertCompanyByCnpj(
      { params: { cnpj: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ company: { id: '1' } })
    );
  });

  test('upsertCompanyByCnpj handles errors', async () => {
    repository.upsertByCnpj.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await upsertCompanyByCnpj(
      { params: { cnpj: '1' }, body: { companyName: 'A' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteCompanyById deletes company', async () => {
    repository.deleteById.mockResolvedValue({ id: '1' });
    const res = createRes();

    await deleteCompanyById({ params: { id: '1' } }, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('deleteCompanyById returns 404 when missing', async () => {
    repository.deleteById.mockResolvedValue(null);
    const res = createRes();

    await deleteCompanyById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteCompanyById handles errors', async () => {
    repository.deleteById.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await deleteCompanyById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteCompanyByCnpj deletes company', async () => {
    repository.deleteByCnpj.mockResolvedValue({ id: '1' });
    const res = createRes();

    await deleteCompanyByCnpj({ params: { cnpj: '1' } }, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('deleteCompanyByCnpj returns 404 when missing', async () => {
    repository.deleteByCnpj.mockResolvedValue(null);
    const res = createRes();

    await deleteCompanyByCnpj({ params: { cnpj: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteCompanyByCnpj handles errors', async () => {
    repository.deleteByCnpj.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await deleteCompanyByCnpj({ params: { cnpj: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteCompaniesByIds validates ids', async () => {
    const res = createRes();

    await deleteCompaniesByIds({ body: { ids: [] } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deleteCompaniesByIds deletes companies', async () => {
    repository.deleteByIds.mockResolvedValue({ deletedCount: 2 });
    const res = createRes();

    await deleteCompaniesByIds({ body: { ids: ['1', '2'] } }, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ deletedCount: 2 })
    );
  });

  test('deleteCompaniesByIds handles errors', async () => {
    repository.deleteByIds.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await deleteCompaniesByIds({ body: { ids: ['1'] } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findUniqueStates returns values', async () => {
    repository.findDistinctStates.mockResolvedValue(['ST']);
    const res = createRes();

    await findUniqueStates({}, res);

    expect(res.send).toHaveBeenCalledWith(['ST']);
  });

  test('findUniqueStates handles errors', async () => {
    repository.findDistinctStates.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findUniqueStates({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findUniqueCities returns values', async () => {
    repository.findDistinctCities.mockResolvedValue(['City']);
    const res = createRes();

    await findUniqueCities({}, res);

    expect(res.send).toHaveBeenCalledWith(['City']);
  });

  test('findUniqueCities handles errors', async () => {
    repository.findDistinctCities.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findUniqueCities({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findUniqueCompanyTypes returns values', async () => {
    repository.findDistinctCompanyTypes.mockResolvedValue(['Type']);
    const res = createRes();

    await findUniqueCompanyTypes({}, res);

    expect(res.send).toHaveBeenCalledWith(['Type']);
  });

  test('findUniqueCompanyTypes handles errors', async () => {
    repository.findDistinctCompanyTypes.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findUniqueCompanyTypes({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesWithoutCnpj returns companies', async () => {
    repository.getCompaniesWithoutCnpj.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesWithoutCnpj({}, res);

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesWithoutCnpj handles errors', async () => {
    repository.getCompaniesWithoutCnpj.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesWithoutCnpj({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateCompanyStatistics validates statistics', async () => {
    const res = createRes();

    await updateCompanyStatistics(
      { params: { cnpj: '1' }, body: {} },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCompanyStatistics updates stats', async () => {
    repository.updateStatistics.mockResolvedValue({ id: '1' });
    const res = createRes();

    await updateCompanyStatistics(
      { params: { cnpj: '1' }, body: { statistics: { total: 1 } } },
      res
    );

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('updateCompanyStatistics returns 404 when missing', async () => {
    repository.updateStatistics.mockResolvedValue(null);
    const res = createRes();

    await updateCompanyStatistics(
      { params: { cnpj: '1' }, body: { statistics: { total: 1 } } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateCompanyStatistics handles errors', async () => {
    repository.updateStatistics.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await updateCompanyStatistics(
      { params: { cnpj: '1' }, body: { statistics: { total: 1 } } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesByPrimaryActivityCode returns companies', async () => {
    repository.findCompaniesByPrimaryActivity.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesByPrimaryActivityCode(
      { params: { activityCode: 'A' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesByPrimaryActivityCode handles errors', async () => {
    repository.findCompaniesByPrimaryActivity.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesByPrimaryActivityCode(
      { params: { activityCode: 'A' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('findCompaniesBySecondaryActivityCode returns companies', async () => {
    repository.findCompaniesBySecondaryActivity.mockResolvedValue([{ id: '1' }]);
    const res = createRes();

    await findCompaniesBySecondaryActivityCode(
      { params: { activityCode: 'B' } },
      res
    );

    expect(res.send).toHaveBeenCalledWith([{ id: '1' }]);
  });

  test('findCompaniesBySecondaryActivityCode handles errors', async () => {
    repository.findCompaniesBySecondaryActivity.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await findCompaniesBySecondaryActivityCode(
      { params: { activityCode: 'B' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getOverallCompanyStatistics returns stats', async () => {
    repository.getCompanyStatistics.mockResolvedValue({ total: 1 });
    const res = createRes();

    await getOverallCompanyStatistics({}, res);

    expect(res.send).toHaveBeenCalledWith({ total: 1 });
  });

  test('getOverallCompanyStatistics handles errors', async () => {
    repository.getCompanyStatistics.mockRejectedValue(new Error('fail'));
    const res = createRes();

    await getOverallCompanyStatistics({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

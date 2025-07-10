import { jest } from '@jest/globals';

const getTransactionsIdEmptyCnpj = jest.fn();
const updateById = jest.fn();
const findById = jest.fn();

const companiesCnpj = jest.fn();

jest.unstable_mockModule('../../../repository/transactionRepository.js', () => ({
  getTransactionsIdEmptyCnpj,
  updateById,
  findById,
}));

jest.unstable_mockModule(
  '../../importer/discovery/cnpj/companiesCnpj.js',
  () => ({
    companiesCnpj,
  })
);

const { identifyAndUpdateCompanyFields } = await import('./index.js');

let consoleLog;
let consoleError;

describe('identifyAndUpdateCompanyFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  test('updates company fields when match is found', async () => {
    getTransactionsIdEmptyCnpj.mockResolvedValue(['t1', 't2']);
    findById
      .mockResolvedValueOnce({ transactionDescription: 'Amazon' })
      .mockResolvedValueOnce({ transactionDescription: 'Unknown' });
    companiesCnpj
      .mockReturnValueOnce({ companyName: 'Amazon', companyCnpj: '123' })
      .mockReturnValueOnce({ companyName: '', companyCnpj: '' });

    await identifyAndUpdateCompanyFields();

    expect(updateById).toHaveBeenCalledWith('t1', {
      companyName: 'Amazon',
      companyCnpj: '123',
    });
    expect(updateById).toHaveBeenCalledTimes(1);
  });

  test('logs errors when transaction processing fails', async () => {
    getTransactionsIdEmptyCnpj.mockResolvedValue(['t1']);
    findById.mockRejectedValue(new Error('boom'));

    await identifyAndUpdateCompanyFields();

    expect(consoleError).toHaveBeenCalled();
  });
});

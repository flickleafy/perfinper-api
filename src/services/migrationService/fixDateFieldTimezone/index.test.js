import { jest } from '@jest/globals';

const getTransactionsIdTransactionSource = jest.fn();
const findById = jest.fn();
const updateById = jest.fn();

jest.unstable_mockModule('../../../repository/transactionRepository.js', () => ({
  getTransactionsIdTransactionSource,
  findById,
  updateById,
}));

const { fixDateFieldTimezone } = await import('./index.js');

let consoleLog;
let consoleError;

describe('fixDateFieldTimezone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  test('updates transaction date timezone when date exists', async () => {
    getTransactionsIdTransactionSource.mockResolvedValue(['t1', 't2']);
    findById
      .mockResolvedValueOnce({ transactionDate: '2024-01-01T00:00:00.000Z' })
      .mockResolvedValueOnce({ transactionDate: null });
    updateById.mockResolvedValue({ id: 't1' });

    await fixDateFieldTimezone();

    expect(updateById).toHaveBeenCalledWith('t1', {
      transactionDate: '2024-01-01T12:00:00-04:00',
    });
    expect(updateById).toHaveBeenCalledTimes(1);
  });

  test('logs error when transaction lookup fails', async () => {
    getTransactionsIdTransactionSource.mockResolvedValue(['t1']);
    findById.mockRejectedValue(new Error('boom'));

    await fixDateFieldTimezone();

    expect(consoleError).toHaveBeenCalled();
  });
});

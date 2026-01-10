import { jest } from '@jest/globals';

const findCreditCardInstallments = jest.fn();
const findAllByDescription = jest.fn();
const insert = jest.fn();
const deleteByIds = jest.fn();

jest.unstable_mockModule('../../../repository/transactionRepository.js', () => ({
  findCreditCardInstallments,
  findAllByDescription,
  insert,
  deleteByIds,
}));

const { mergeCreditCardTransactionsInstallments } = await import('./index.js');

let consoleLog;
let consoleError;

describe('mergeCreditCardTransactionsInstallments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  test('merges installments and deletes originals', async () => {
    findCreditCardInstallments.mockResolvedValue([
      { transactionDescription: 'Antecipada - Store - 1/2' },
      { transactionDescription: 'Store - 2/2' },
    ]);

    findAllByDescription.mockResolvedValue([
      {
        id: 't1',
        transactionDate: '2024-01-01',
        transactionValue: '10,00',
        transactionInstallments: '2',
        transactionDescription: 'Store - 1/2',
      },
      {
        id: 't2',
        transactionDate: '2024-02-01',
        transactionValue: '15,00',
        transactionInstallments: '2',
        transactionDescription: 'Store - 2/2',
      },
    ]);

    insert.mockResolvedValue({ id: 'new' });
    deleteByIds.mockResolvedValue({ deletedCount: 2 });

    await mergeCreditCardTransactionsInstallments();

    expect(findAllByDescription).toHaveBeenCalledWith('Store');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionDescription: 'Store',
        transactionValue: '25,00',
        installments: {
          installmentsAmount: '2',
          installmentsInformation: [
            {
              installmentDate: '2024-01-01',
              installmentValue: '10,00',
            },
            {
              installmentDate: '2024-02-01',
              installmentValue: '15,00',
            },
          ],
        },
      })
    );
    expect(deleteByIds).toHaveBeenCalledWith(['t1', 't2']);
  });

  test('skips merge when installments mismatch', async () => {
    findCreditCardInstallments.mockResolvedValue([
      { transactionDescription: 'Store - 1/3' },
    ]);
    findAllByDescription.mockResolvedValue([
      {
        id: 't1',
        transactionDate: '2024-01-01',
        transactionValue: '10,00',
        transactionInstallments: '3',
        transactionDescription: 'Store - 1/3',
      },
      {
        id: 't2',
        transactionDate: '2024-02-01',
        transactionValue: '15,00',
        transactionInstallments: '3',
        transactionDescription: 'Store - 2/3',
      },
    ]);

    await mergeCreditCardTransactionsInstallments();

    expect(insert).not.toHaveBeenCalled();
    expect(deleteByIds).not.toHaveBeenCalled();
  });

  test('logs errors when processing fails', async () => {
    findCreditCardInstallments.mockResolvedValue([
      { transactionDescription: 'Store - 1/2' },
    ]);
    findAllByDescription.mockRejectedValue(new Error('boom'));

    await mergeCreditCardTransactionsInstallments();

    expect(consoleError).toHaveBeenCalled();
  });

  test('logs error when delete count mismatches', async () => {
    findCreditCardInstallments.mockResolvedValue([
      { transactionDescription: 'Store - 1/2' },
    ]);

    findAllByDescription.mockResolvedValue([
      {
        id: 't1',
        transactionDate: '2024-01-01',
        transactionValue: '10,00',
        transactionInstallments: '2',
        transactionDescription: 'Store - 1/2',
      },
      {
        id: 't2',
        transactionDate: '2024-02-01',
        transactionValue: '15,00',
        transactionInstallments: '2',
        transactionDescription: 'Store - 2/2',
      },
    ]);

    insert.mockResolvedValue({ id: 'new' });
    deleteByIds.mockResolvedValue({ deletedCount: 1 });

    await mergeCreditCardTransactionsInstallments();

    expect(consoleError).toHaveBeenCalled();
  });

  test('uses earliest transaction date as prototype', async () => {
    findCreditCardInstallments.mockResolvedValue([
      { transactionDescription: 'Store - 1/2' },
    ]);

    findAllByDescription.mockResolvedValue([
      {
        id: 't1',
        transactionDate: '2024-02-01',
        transactionValue: '10,00',
        transactionInstallments: '2',
        transactionDescription: 'Store - 1/2',
      },
      {
        id: 't2',
        transactionDate: '2024-01-01',
        transactionValue: '15,00',
        transactionInstallments: '2',
        transactionDescription: 'Store - 2/2',
      },
    ]);

    insert.mockResolvedValue({ id: 'new' });
    deleteByIds.mockResolvedValue({ deletedCount: 2 });

    await mergeCreditCardTransactionsInstallments();

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ transactionDate: '2024-01-01' })
    );
  });
});

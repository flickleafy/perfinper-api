import { jest } from '@jest/globals';

// Mock dependencies using unstable_mockModule BEFORE importing the module under test
jest.unstable_mockModule('../src/repository/transactionRepository.js', () => ({
  insert: jest.fn(),
}));

jest.unstable_mockModule('../src/services/importer/adapters/index.js', () => ({
  nubankAdapter: jest.fn(),
  nubankCreditAdapter: jest.fn(),
  digioCreditAdapter: jest.fn(),
  mercadolivreAdapter: jest.fn(),
  flashAdapter: jest.fn(),
}));

const { transactionsImporter } = await import('../src/services/importer/transactionsImporter.js');
const transactionRepository = await import('../src/repository/transactionRepository.js');
const { nubankAdapter } = await import('../src/services/importer/adapters/index.js');

describe('Transactions Importer with Fiscal Book', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should insert transaction with fiscalBookId when provided', async () => {
    const transactions = [{ id: '1', description: 'Test' }];
    const fiscalBookId = 'fb123';
    const categories = [];
    
    // Mock adapter to return an object
    nubankAdapter.mockReturnValue({
      transactionDate: new Date(),
      transactionDescription: 'Test',
      transactionValue: 100
    });

    await transactionsImporter(transactions, 'nubank', categories, fiscalBookId);

    expect(transactionRepository.insert).toHaveBeenCalledTimes(1);
    const insertedTransaction = transactionRepository.insert.mock.calls[0][0];
    expect(insertedTransaction).toHaveProperty('fiscalBookId', fiscalBookId);
  });

  test('should insert transaction without fiscalBookId when not provided', async () => {
    const transactions = [{ id: '1', description: 'Test' }];
    const categories = [];
    
    // Mock adapter to return an object
    nubankAdapter.mockReturnValue({
      transactionDate: new Date(),
      transactionDescription: 'Test',
      transactionValue: 100
    });

    await transactionsImporter(transactions, 'nubank', categories);

    expect(transactionRepository.insert).toHaveBeenCalledTimes(1);
    const insertedTransaction = transactionRepository.insert.mock.calls[0][0];
    expect(insertedTransaction.fiscalBookId).toBeUndefined();
  });
});

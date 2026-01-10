import { jest } from '@jest/globals';

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: logger,
}));

const {
  identifyAndUpdateCompanyFields,
  mergeCreditCardTransactionsInstallments,
  fixDateFieldTimezone,
  migrateCompanyDataToCompanyCollection,
  fixCompaniesEntities,
  migrateTransactionsToFiscalBooks,
} = await import('./index.js');

describe('migrationService index', () => {
  test('re-exports migration helpers', () => {
    expect(typeof identifyAndUpdateCompanyFields).toBe('function');
    expect(typeof mergeCreditCardTransactionsInstallments).toBe('function');
    expect(typeof fixDateFieldTimezone).toBe('function');
    expect(typeof migrateCompanyDataToCompanyCollection).toBe('function');
    expect(typeof fixCompaniesEntities).toBe('function');
    expect(typeof migrateTransactionsToFiscalBooks).toBe('function');
  });
});

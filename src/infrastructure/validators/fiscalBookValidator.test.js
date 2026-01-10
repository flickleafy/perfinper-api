import validator, {
  validateFiscalBookData,
  validateTransactionFiscalBookRelationship,
} from './fiscalBookValidator.js';

describe('fiscalBookValidator', () => {
  test('validateFiscalBookData detects missing required fields', () => {
    const result = validateFiscalBookData({});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Book name is required',
        'Book type is required',
        'Book period is required',
      ])
    );
  });

  test('validateFiscalBookData validates enums and fiscal data', () => {
    const result = validateFiscalBookData({
      bookName: 'Book A',
      bookType: 'InvalidType',
      bookPeriod: '2024/01',
      status: 'Unknown',
      fiscalData: {
        fiscalYear: 1800,
        taxRegime: 'Invalid',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Invalid book type',
        'Book period must be in YYYY-MM or YYYY format',
        'Invalid status',
        'Fiscal year must be a valid year',
        'Invalid tax regime',
      ])
    );
  });

  test('validateFiscalBookData accepts a valid book', () => {
    const result = validateFiscalBookData({
      bookName: 'Book A',
      bookType: 'Entrada',
      bookPeriod: '2024-01',
      status: 'Aberto',
      fiscalData: {
        fiscalYear: 2024,
        taxRegime: 'Simples Nacional',
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateTransactionFiscalBookRelationship checks month mismatch', () => {
    const result = validateTransactionFiscalBookRelationship(
      { bookPeriod: '2024-01', status: 'Aberto' },
      { transactionPeriod: '2024-02' }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/doesn't match book period/);
  });

  test('validateTransactionFiscalBookRelationship checks year mismatch', () => {
    const result = validateTransactionFiscalBookRelationship(
      { bookPeriod: '2024', status: 'Aberto' },
      { transactionPeriod: '2023-12' }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/is not in book year/);
  });

  test('validateTransactionFiscalBookRelationship checks company mismatch', () => {
    const result = validateTransactionFiscalBookRelationship(
      {
        bookPeriod: '2024-01',
        status: 'Aberto',
        companyId: { toString: () => 'a' },
      },
      {
        transactionPeriod: '2024-01',
        companyId: { toString: () => 'b' },
      }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Transaction company does not match fiscal book company'
    );
  });

  test('validateTransactionFiscalBookRelationship blocks closed books', () => {
    const result = validateTransactionFiscalBookRelationship(
      { bookPeriod: '2024-01', status: 'Fechado' },
      { transactionPeriod: '2024-01' }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Cannot add transactions to a fechado fiscal book'
    );
  });

  test('validateTransactionFiscalBookRelationship accepts valid data', () => {
    const result = validateTransactionFiscalBookRelationship(
      {
        bookPeriod: '2024',
        status: 'Aberto',
        companyId: { toString: () => 'same' },
      },
      {
        transactionPeriod: '2024-07',
        companyId: { toString: () => 'same' },
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('default export exposes validation functions', () => {
    expect(validator.validateFiscalBookData).toBe(validateFiscalBookData);
    expect(validator.validateTransactionFiscalBookRelationship).toBe(
      validateTransactionFiscalBookRelationship
    );
  });
});

/**
 * Validates fiscal book data
 * @param {Object} bookData - Fiscal book data to validate
 * @returns {Object} Validation result with errors if any
 */
export function validateFiscalBookData(bookData) {
  const errors = [];

  // Required fields
  if (!bookData.bookName) {
    errors.push('Book name is required');
  }

  if (!bookData.bookType) {
    errors.push('Book type is required');
  } else if (
    !['Entrada', 'Saída', 'Serviços', 'Inventário', 'Outros'].includes(
      bookData.bookType
    )
  ) {
    errors.push('Invalid book type');
  }

  if (!bookData.bookPeriod) {
    errors.push('Book period is required');
  } else {
    // Validate period format (YYYY-MM or YYYY)
    const periodRegex = /^(\d{4})(-\d{2})?$/;
    if (!periodRegex.test(bookData.bookPeriod)) {
      errors.push('Book period must be in YYYY-MM or YYYY format');
    }
  }

  // Status validation
  if (
    bookData.status &&
    !['Aberto', 'Fechado', 'Em Revisão', 'Arquivado'].includes(bookData.status)
  ) {
    errors.push('Invalid status');
  }

  // Fiscal data validation if present
  if (bookData.fiscalData) {
    const { fiscalYear, taxRegime } = bookData.fiscalData;

    if (
      fiscalYear &&
      (isNaN(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100)
    ) {
      errors.push('Fiscal year must be a valid year');
    }

    if (
      taxRegime &&
      !['Simples Nacional', 'Lucro Real', 'Lucro Presumido', 'Outro'].includes(
        taxRegime
      )
    ) {
      errors.push('Invalid tax regime');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates transaction to fiscal book relationship
 * @param {Object} fiscalBook - Fiscal book data
 * @param {Object} transaction - Transaction data
 * @returns {Object} Validation result with errors if any
 */
export function validateTransactionFiscalBookRelationship(
  fiscalBook,
  transaction
) {
  const errors = [];

  // Check if transaction period matches book period
  // Book period can be YYYY-MM or YYYY, transaction will be YYYY-MM
  const bookPeriod = fiscalBook.bookPeriod;
  const transactionPeriod = transaction.transactionPeriod;

  if (bookPeriod.length === 7) {
    // YYYY-MM format
    if (bookPeriod !== transactionPeriod) {
      errors.push(
        `Transaction period (${transactionPeriod}) doesn't match book period (${bookPeriod})`
      );
    }
  } else if (bookPeriod.length === 4) {
    // YYYY format
    if (!transactionPeriod.startsWith(bookPeriod)) {
      errors.push(
        `Transaction period (${transactionPeriod}) is not in book year (${bookPeriod})`
      );
    }
  }

  // Check if company IDs match if both are present
  if (
    fiscalBook.companyId &&
    transaction.companyId &&
    fiscalBook.companyId.toString() !== transaction.companyId.toString()
  ) {
    errors.push('Transaction company does not match fiscal book company');
  }

  // Cannot add transactions to closed or archived books
  if (['Fechado', 'Arquivado'].includes(fiscalBook.status)) {
    errors.push(
      `Cannot add transactions to a ${fiscalBook.status.toLowerCase()} fiscal book`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default {
  validateFiscalBookData,
  validateTransactionFiscalBookRelationship,
};

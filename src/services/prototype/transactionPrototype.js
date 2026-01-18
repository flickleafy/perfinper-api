import { paymentMethodAdapter } from './paymenthMethodAdapter.js';
import { normalizeMonetaryValue } from '../../infrastructure/monetary/monetaryUtils.js';

export function transactionPrototype(body) {
  body = JSON.parse(JSON.stringify(body));
  const {
    transactionDate,
    transactionPeriod,
    transactionSource,
    transactionValue,
    totalValue, // deprecated field
    transactionName,
    itemName, // deprecated field
    transactionInstallments, // deprecated field
    installments,
    transactionDescription,
    itemDescription, // deprecated field
    transactionFiscalNote,
    transactionId,
    transactionStatus,
    transactionLocation,
    transactionType,
    transactionCategory,
    freightValue,
    paymentMethod,
    items,
    companyName,
    companySellerName,
    companyCnpj,
    companyId,
    fiscalBookId,
  } = body;

  // Normalize monetary values to comma format
  const rawValue = transactionValue || totalValue;
  const normalizedTransactionValue = rawValue ? normalizeMonetaryValue(rawValue) : undefined;
  const normalizedFreightValue = freightValue ? normalizeMonetaryValue(freightValue) : undefined;

  return {
    transactionDate,
    transactionPeriod,
    transactionSource,
    transactionValue: normalizedTransactionValue,
    transactionName: transactionName ? transactionName : itemName,
    transactionInstallments,
    installments,
    transactionDescription: transactionDescription
      ? transactionDescription
      : itemDescription,
    transactionFiscalNote: transactionFiscalNote || '',
    transactionId,
    transactionStatus,
    transactionLocation: transactionLocation || 'other',
    transactionType,
    transactionCategory,
    freightValue: normalizedFreightValue,
    paymentMethod: paymentMethod || paymentMethodAdapter(body),
    items,
    companyName,
    companySellerName,
    companyCnpj,
    companyId,
    fiscalBookId,
  };
}

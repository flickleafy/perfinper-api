import { paymentMethodAdapter } from './paymenthMethodAdapter.js';

export function transactionPrototype(body) {
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
  } = body;

  return {
    transactionDate,
    transactionPeriod,
    transactionSource,
    transactionValue: transactionValue || totalValue,
    transactionName: transactionName || itemName,
    transactionInstallments,
    installments,
    transactionDescription: transactionDescription || itemDescription,
    transactionFiscalNote: transactionFiscalNote || '',
    transactionId,
    transactionStatus,
    transactionLocation: transactionLocation || 'other',
    transactionType,
    transactionCategory,
    freightValue,
    paymentMethod: paymentMethod || paymentMethodAdapter(body),
    items,
    companyName,
    companySellerName,
    companyCnpj,
  };
}

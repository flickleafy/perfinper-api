export function transactionPrototype(body) {
  const {
    transactionDate,
    transactionPeriod,
    transactionSource,
    transactionValue,
    transactionName,
    transactionInstallments,
    transactionDescription,
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
    transactionValue,
    transactionName,
    transactionInstallments,
    transactionDescription,
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
  };
}

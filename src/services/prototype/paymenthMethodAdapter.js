const transactionSourceToPaymentMethodAdapter = {
  manual: 'money',
  nubank: 'pix',
  // nubank: 'boleto',
  // nubank: 'debit card',
  'nubank-credit': 'credit card',
  'digio-credit': 'credit card',
  flash: 'benefit card',
};

export function paymentMethodAdapter(transaction) {
  const { paymentMethod, transactionSource } = transaction;

  let transactionDescription =
    transaction.transactionDescription || transaction.itemDescription;
  transactionDescription = String(transactionDescription).toLowerCase();

  if (paymentMethod) {
    return paymentMethod;
  }

  let inferredPaymentMethod = null;
  if (transactionDescription.includes('boleto')) {
    inferredPaymentMethod = 'boleto';
  } else if (transactionDescription.includes('pix')) {
    inferredPaymentMethod = 'pix';
  } else {
    inferredPaymentMethod =
      transactionSourceToPaymentMethodAdapter[transactionSource];
  }

  return inferredPaymentMethod;
}

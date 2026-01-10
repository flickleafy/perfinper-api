import { categoryNameToId } from './categoryNameToId.js';

export function indentifyTransactionCategory(
  categories,
  transactionType,
  description
) {
  let transactionCategory = categoryNameToId('Despesa', categories);
  if (
    transactionType === 'credit' &&
    (description.includes('Depósito') ||
      description.includes('Transferência Recebida') ||
      description.includes('Benefício'))
  ) {
    transactionCategory = categoryNameToId('Salário', categories);
  } else if (transactionType === 'credit') {
    transactionCategory = categoryNameToId('Receita', categories);
  }
  return transactionCategory;
}

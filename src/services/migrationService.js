import {
  getTransactionsIdEmptyCnpj,
  findById,
  updateById,
} from '../repository/transactionRepository.js';

export async function identifyAndUpdateCompanyFields() {
  const transactionsId = await getTransactionsIdEmptyCnpj();
  console.log('transactions ids', JSON.stringify(transactionsId, null, 4));
}

import {
  getTransactionsIdEmptyCnpj,
  updateById,
  findById,
} from '../../../repository/transactionRepository.js';
import { companiesCnpj } from '../../importer/discovery/cnpj/companiesCnpj.js';

export async function identifyAndUpdateCompanyFields() {
  const transactionsId = await getTransactionsIdEmptyCnpj();

  for await (const id of transactionsId) {
    try {
      const transaction = await findById(id);
      // console.log(`Transaction object ${transaction}`);
      const { transactionDescription } = JSON.parse(
        JSON.stringify(transaction)
      );

      const { companyName, companyCnpj } = companiesCnpj(
        transactionDescription
      );

      if (companyName && companyCnpj && transactionDescription) {
        const updateData = {};
        updateData.companyName = companyName;
        updateData.companyCnpj = companyCnpj;

        const updatedTransaction = await updateById(id, updateData);
        console.log(
          `Updated transaction ${id}:`,
          JSON.stringify(updatedTransaction, null, 4)
        );
      } else {
        console.log(
          `No company data found for transaction ${id} based on description: ${transactionDescription}`
        );
      }
    } catch (error) {
      console.error(`Error processing transaction ${id}:`, error.message);
    }
  }
}

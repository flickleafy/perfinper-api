import {
  findById,
  updateById,
  getTransactionsIdTransactionSource,
} from '../../../repository/transactionRepository.js';

export async function fixDateFieldTimezone() {
  const transactionsId = await getTransactionsIdTransactionSource('nubank');

  for await (const id of transactionsId) {
    try {
      const transaction = await findById(id);
      // console.log(`Transaction object ${transaction}`);
      const { transactionDate } = JSON.parse(JSON.stringify(transaction));

      if (transactionDate) {
        const updateData = {};
        const [date, time] = String(transactionDate).split('T');
        console.log(`date ${date}, time ${time}`);
        updateData.transactionDate = `${date}T12:00:00-04:00`;
        console.log(`new date time ${JSON.stringify(updateData)}`);
        const updatedTransaction = await updateById(id, updateData);
        console.log(
          `Updated transaction ${id}:`,
          JSON.stringify(updatedTransaction, null, 4)
        );
      } else {
        console.log(`Transaction date not available for transaction ${id}`);
      }
    } catch (error) {
      console.error(`Error processing transaction ${id}:`, error.message);
    }
  }
}

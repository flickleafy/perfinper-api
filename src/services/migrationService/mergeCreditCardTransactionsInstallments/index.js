import {
  findCreditCardInstallments,
  findAllByDescription,
  insert,
  deleteByIds,
} from '../../../repository/transactionRepository.js';

export async function mergeCreditCardTransactionsInstallments() {
  const descriptionsArray = await findCreditCardInstallments();

  const uniqueDescriptions = new Set();

  descriptionsArray.forEach((doc) => {
    const modifiedDescription = doc.transactionDescription
      .replace('Antecipada - ', '')
      .replace(/- \d+\/\d+/, '')
      .trim();
    uniqueDescriptions.add(modifiedDescription);
  });
  console.log('uniqueDescriptions', uniqueDescriptions);

  for (const description of uniqueDescriptions) {
    const regexStr = description.replace('*', '\\*');
    try {
      // find way to separate transactions that collide when description is the same
      const installmentsFromTransaction = await findAllByDescription(regexStr);
      console.log('Processing:', regexStr);
      console.log(
        `Results for ${description}:`,
        JSON.stringify(installmentsFromTransaction, null, 4)
      );
      const { transactionInstallments } = installmentsFromTransaction[0];

      if (
        Number(transactionInstallments) !== installmentsFromTransaction.length
      ) {
        console.log(
          `Installments mismatch, transaction ${description} cant be merged`
        );
        continue;
      }

      const mergedInstallments = mergeCreditCardInstallments(
        installmentsFromTransaction,
        description
      );

      const transactionsIds = getTransactionIds(installmentsFromTransaction);

      console.log(
        'merged transaction',
        JSON.stringify(mergedInstallments, null, 4)
      );
      console.log('transactionsIds', transactionsIds);

      const resultSave = await insert(mergedInstallments);
      console.log('resultSave', resultSave);
      if (resultSave.id) {
        const resultDelete = await deleteByIds(transactionsIds);
        console.log('resultDelete', JSON.stringify(resultDelete, null, 4));
        if (resultDelete.deletedCount === transactionsIds.length) {
          console.log(`Successful processing ${description}`);
        } else {
          console.error(`Error processing ${description}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing ${description}:`, error);
    }
  }
}

function mergeCreditCardInstallments(installments, newDescription) {
  // Step 1: Find the oldest installment - it is the start date of the transaction
  const oldestInstallment = installments.reduce((oldest, current) => {
    return new Date(oldest.transactionDate) < new Date(current.transactionDate)
      ? oldest
      : current;
  });

  // Step 2: Calculate the sum of installments values
  const totalValue = installments.reduce((sum, installment) => {
    // Replace commas with dots for floating-point conversion
    const value = parseFloat(installment.transactionValue.replace(',', '.'));
    return sum + value;
  }, 0);

  // Deep clone the oldest installment to ensure independence
  const prototypeTransaction = JSON.parse(JSON.stringify(oldestInstallment));

  // Step 3: Update the prototype object
  delete prototypeTransaction.id;
  prototypeTransaction.transactionDescription = newDescription;
  prototypeTransaction.transactionValue = totalValue
    .toFixed(2)
    .replace('.', ',');
  prototypeTransaction.installments = {
    installmentsAmount: prototypeTransaction.transactionInstallments,
    installmentsInformation: installmentsAdapter(installments),
  };
  delete prototypeTransaction.transactionInstallments;

  return prototypeTransaction;
}

function getTransactionIds(transactions) {
  // Use the map function to extract ids from each transaction object
  const ids = transactions.map((transaction) => transaction.id);
  return ids;
}

function installmentsAdapter(installments = []) {
  const mergedInstalmments = installments.map((installment) => {
    return {
      installmentDate: installment.transactionDate,
      installmentValue: installment.transactionValue,
    };
  });
  return mergedInstalmments;
}

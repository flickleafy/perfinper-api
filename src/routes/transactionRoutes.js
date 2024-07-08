import express from 'express';
import {
  insertTransaction,
  findTransactionById,
  updateTransactionById,
  deleteTransactionById,
  separateTransactionById,
  findAllTransactionsInPeriod,
  removeAllTransactionsInPeriod,
  findUniquePeriods,
  findUniqueYears,
} from '../services/transactionService.js';

const transactionRouter = express.Router();
// ?period=2019-03
transactionRouter.post('/', insertTransaction);
transactionRouter.get('/:id', findTransactionById);
transactionRouter.put('/:id', updateTransactionById);
transactionRouter.delete('/:id', deleteTransactionById);
transactionRouter.post('/separate/:id', separateTransactionById);

transactionRouter.get(
  '/period/:transactionPeriod',
  findAllTransactionsInPeriod
);
transactionRouter.delete(
  '/period/:transactionPeriod',
  removeAllTransactionsInPeriod
);
transactionRouter.post('/periods', findUniquePeriods);
transactionRouter.post('/years', findUniqueYears);

export default transactionRouter;

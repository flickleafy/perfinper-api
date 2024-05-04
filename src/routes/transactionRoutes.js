import express from 'express';
import transactionService from '../services/transactionService.js';

const transactionRouter = express.Router();
// ?period=2019-03
transactionRouter.post('/', transactionService.insertTransaction);
transactionRouter.get('/:id', transactionService.findTransactionById);
transactionRouter.put('/:id', transactionService.updateTransactionById);
transactionRouter.delete('/:id', transactionService.deleteTransactionById);

transactionRouter.get(
  '/period/:transactionPeriod',
  transactionService.findAllTransactionsInPeriod
);
transactionRouter.delete(
  '/period/:transactionPeriod',
  transactionService.removeAllTransactionsInPeriod
);
transactionRouter.post('/periods', transactionService.findUniquePeriods);

export default transactionRouter;

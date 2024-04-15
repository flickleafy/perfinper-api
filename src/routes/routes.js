const express = require('express');
const transactionService = require('../services/transactionService.js');
const transactionRouter = express.Router();

// ?period=2019-03
transactionRouter.post('/', transactionService.insertTransaction);
transactionRouter.get('/:id', transactionService.findTransactionById);
transactionRouter.put('/:id', transactionService.updateTransactionById);
transactionRouter.delete('/:id', transactionService.deleteTransactionById);

transactionRouter.get(
  '/period/:yearMonth',
  transactionService.findAllTransactionsInPeriod
);
transactionRouter.delete(
  '/period/:yearMonth',
  transactionService.removeAllTransactionsInPeriod
);
transactionRouter.post('/periods', transactionService.findUniquePeriods);

module.exports = transactionRouter;

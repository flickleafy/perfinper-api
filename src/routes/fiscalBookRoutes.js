import express from 'express';
import * as fiscalBookService from '../services/fiscalBookService.js';

const router = express.Router();

/**
 * @route   GET /api/fiscal-book
 * @desc    Get all fiscal books with optional filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      period,
      status,
      company,
      limit = 50,
      skip = 0,
      sort = '-createdAt',
    } = req.query;

    // Build filter object based on query parameters
    const filter = {};
    if (type) filter.bookType = type;
    if (period) filter.bookPeriod = period;
    if (status) filter.status = status;
    if (company) filter.companyId = company;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      sort,
    };

    const books = await fiscalBookService.getAllFiscalBooks(filter, options);
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/fiscal-book/statistics
 * @desc    Get fiscal book statistics
 * @access  Public
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await fiscalBookService.getFiscalBookStatistics();
    res.json(statistics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/fiscal-book/:id
 * @desc    Get fiscal book by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await fiscalBookService.getFiscalBookById(req.params.id);
    res.json(book);
  } catch (error) {
    console.error(error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/fiscal-book/:id/transactions
 * @desc    Get transactions for a fiscal book
 * @access  Public
 */
router.get('/:id/transactions', async (req, res) => {
  try {
    const transactions = await fiscalBookService.getFiscalBookTransactions(
      req.params.id
    );
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/fiscal-book
 * @desc    Create a new fiscal book
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const newBook = await fiscalBookService.createFiscalBook(req.body);
    res.status(201).json(newBook);
  } catch (error) {
    console.error(error);
    if (error.message.includes('Invalid fiscal book data:')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/fiscal-book/:id
 * @desc    Update a fiscal book
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedBook = await fiscalBookService.updateFiscalBook(
      req.params.id,
      req.body
    );
    res.json(updatedBook);
  } catch (error) {
    console.error(error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/fiscal-book/:id
 * @desc    Delete a fiscal book
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedBook = await fiscalBookService.deleteFiscalBook(req.params.id);
    res.json({ message: 'Fiscal book deleted', data: deletedBook });
  } catch (error) {
    console.error(error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    } else if (
      error.message === 'Cannot delete fiscal book with associated transactions'
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/fiscal-book/:id/close
 * @desc    Close a fiscal book
 * @access  Public
 */
router.put('/:id/close', async (req, res) => {
  try {
    const closedBook = await fiscalBookService.closeFiscalBook(req.params.id);
    res.json(closedBook);
  } catch (error) {
    console.error(error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/fiscal-book/:id/reopen
 * @desc    Reopen a fiscal book
 * @access  Public
 */
router.put('/:id/reopen', async (req, res) => {
  try {
    const reopenedBook = await fiscalBookService.reopenFiscalBook(
      req.params.id
    );
    res.json(reopenedBook);
  } catch (error) {
    console.error(error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/fiscal-book/:id/transactions/:transactionId
 * @desc    Add a transaction to a fiscal book
 * @access  Public
 */
router.put('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const updatedTransaction =
      await fiscalBookService.addTransactionToFiscalBook(
        req.params.id,
        req.params.transactionId
      );
    res.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    if (
      error.message === 'Fiscal book not found' ||
      error.message === 'Transaction not found'
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Invalid transaction-book relationship:')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/fiscal-book/transactions/:transactionId
 * @desc    Remove a transaction from its fiscal book
 * @access  Public
 */
router.delete('/transactions/:transactionId', async (req, res) => {
  try {
    const updatedTransaction =
      await fiscalBookService.removeTransactionFromFiscalBook(
        req.params.transactionId
      );
    res.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    if (error.message === 'Transaction not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/fiscal-book/:id/transactions
 * @desc    Add multiple transactions to a fiscal book
 * @access  Public
 */
router.post('/:id/transactions', async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (
      !transactionIds ||
      !Array.isArray(transactionIds) ||
      transactionIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: 'Transaction IDs array is required' });
    }

    const result = await fiscalBookService.bulkAddTransactionsToFiscalBook(
      req.params.id,
      transactionIds
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

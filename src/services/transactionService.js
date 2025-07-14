import logger from '../config/logger.js';
import {
  insert,
  findById,
  findAllInPeriod,
  findAllInYear,
  updateById,
  deleteById,
  separateById,
  deleteAllInPeriod,
  findPeriods,
  findYears,
  findByFiscalBookId,
  updateFiscalBookForTransactions,
  removeFiscalBookFromTransactions,
} from '../repository/transactionRepository.js';
import * as fiscalBookRepository from '../repository/fiscalBookRepository.js';
import { transactionPrototype } from './prototype/transactionPrototype.js';

export const insertTransaction = async (req, res) => {
  try {
    let transactionObject = transactionPrototype(req.body);
    const transaction = await insert(transactionObject);
    res.send(transaction);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algum erro ocorreu ao salvar transaction',
    });
  }
};

export const findTransactionById = async (req, res) => {
  let id = req.params.id;
  try {
    const transaction = await findById(id);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction não encontrada' });
    } else {
      res.send(transaction);
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao listar a transaction',
    });
  }
};

export const findAllTransactionsInPeriod = async (req, res) => {
  const period = String(req.params.transactionPeriod);
  try {
    let transactions = [];
    if (period.length === 4) {
      transactions = await findAllInYear(period);
    } else {
      transactions = await findAllInPeriod(period);
    }
    res.send(transactions);
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Erro ao buscar transações do periodo: ' + period });
  }
};

export const updateTransactionById = async (req, res) => {
  const id = req.params.id;
  if (!req.body) {
    return res.status(400).send({
      message: 'Dados da transaction inexistente',
    });
  }

  let transactionObject = transactionPrototype(req.body);
  try {
    let transaction = await updateById(id, transactionObject);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction não encontrada' });
    }
    res.send({ message: 'Transaction atualizada com sucesso' });
  } catch (error) {
    res.status(500).send({ message: 'Erro ao atualizar a transaction: ' + id });
  }
};

export const deleteTransactionById = async (req, res) => {
  const id = req.params.id;
  try {
    const transaction = await deleteById(id);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction não encontrada' });
    } else {
      res.send({ message: 'Transaction excluida com sucesso' });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Nao foi possivel deletar a transaction: ' + id });
  }
};

export const separateTransactionById = async (req, res) => {
  const id = req.params.id;
  try {
    const transaction = await separateById(id);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction não encontrada' });
    } else {
      res.send({ message: 'Transaction separada com sucesso' });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algum erro ocorreu ao separar transaction',
    });
  }
};

export const removeAllTransactionsInPeriod = async (req, res) => {
  const period = req.params.transactionPeriod;

  if (!period) {
    return res.status(400).send({
      message: 'Transaction period is required',
    });
  }

  try {
    await deleteAllInPeriod(period);
    res.send({ message: `Transactions excluidos` });
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao excluir todas as transactions do periodo: ' + period,
    });
  }
};

export const findUniquePeriods = async (req, res) => {
  try {
    let periods = await findPeriods();
    res.send(periods);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar periodos' });
  }
};

export const findUniqueYears = async (req, res) => {
  try {
    let years = await findYears();
    res.send(years);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar anos' });
  }
};

/**
 * Get transactions by fiscal book ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTransactionsByFiscalBookId = async (req, res) => {
  const fiscalBookId = req.params.fiscalBookId;

  try {
    // Verify fiscal book exists
    const fiscalBook = await fiscalBookRepository.findById(fiscalBookId);
    if (!fiscalBook) {
      return res.status(404).send({ message: 'Fiscal book not found' });
    }

    const transactions = await findByFiscalBookId(fiscalBookId);
    res.send(transactions);
  } catch (error) {
    res.status(500).send({
      message:
        error.message ||
        `Error retrieving transactions for fiscal book ${fiscalBookId}`,
    });
  }
};

/**
 * Assign transactions to a fiscal book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const assignTransactionsToFiscalBook = async (req, res) => {
  const { fiscalBookId, transactionIds } = req.body;

  if (!fiscalBookId || !transactionIds || !Array.isArray(transactionIds)) {
    return res.status(400).send({
      message: 'Fiscal book ID and an array of transaction IDs are required',
    });
  }

  try {
    // Verify fiscal book exists
    const fiscalBook = await fiscalBookRepository.findById(fiscalBookId);
    if (!fiscalBook) {
      return res.status(404).send({ message: 'Fiscal book not found' });
    }

    const result = await updateFiscalBookForTransactions(
      transactionIds,
      fiscalBookId
    );
    res.send({
      message: `Successfully assigned ${result.modifiedCount} transactions to fiscal book`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Error assigning transactions to fiscal book',
    });
  }
};

/**
 * Remove transactions from a fiscal book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeTransactionsFromFiscalBook = async (req, res) => {
  const fiscalBookId = req.params.fiscalBookId;

  try {
    // Verify fiscal book exists
    const fiscalBook = await fiscalBookRepository.findById(fiscalBookId);
    if (!fiscalBook) {
      return res.status(404).send({ message: 'Fiscal book not found' });
    }

    const result = await removeFiscalBookFromTransactions(fiscalBookId);
    res.send({
      message: `Successfully removed ${result.modifiedCount} transactions from fiscal book`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).send({
      message:
        error.message ||
        `Error removing transactions from fiscal book ${fiscalBookId}`,
    });
  }
};

/**
 * Update fiscal book for a single transaction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateTransactionFiscalBook = async (req, res) => {
  const id = req.params.id;
  const { fiscalBookId } = req.body;

  if (fiscalBookId === undefined || fiscalBookId === '') {
    return res.status(400).send({ message: 'Fiscal book ID is required' });
  }

  try {
    // Verify fiscal book exists if not removing
    if (fiscalBookId !== null) {
      const fiscalBook = await fiscalBookRepository.findById(fiscalBookId);
      if (!fiscalBook) {
        return res.status(404).send({ message: 'Fiscal book not found' });
      }
    }

    // Update transaction with fiscal book ID
    const updateData =
      fiscalBookId === null
        ? { $unset: { fiscalBookId: '' } }
        : { fiscalBookId };

    const transaction = await updateById(id, updateData);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction not found' });
    }

    res.send({ message: 'Transaction fiscal book updated successfully' });
  } catch (error) {
    res
      .status(500)
      .send({
        message: `Error updating transaction fiscal book: ${error.message}`,
      });
  }
};

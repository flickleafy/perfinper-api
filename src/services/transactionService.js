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
} from '../repository/transactionRepository.js';
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
  const period = req.query.period;

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

import logger from '../config/logger.js';
import {
  insert,
  findById,
  findAllInPeriod,
  updateById,
  deleteById,
  deleteAllInPeriod,
  findPeriods,
} from '../repository/transactionRepository.js';

const insertTransaction = async (req, res) => {
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

const findTransactionById = async (req, res) => {
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

const findAllTransactionsInPeriod = async (req, res) => {
  const period = req.params.transactionPeriod;
  try {
    let transactions = await findAllInPeriod(period);
    res.send(transactions);
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Erro ao buscar transações do periodo: ' + period });
  }
};

const updateTransactionById = async (req, res) => {
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

const deleteTransactionById = async (req, res) => {
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

const removeAllTransactionsInPeriod = async (req, res) => {
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

const findUniquePeriods = async (req, res) => {
  try {
    let periods = await findPeriods();
    res.send(periods);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar transações do periodo' });
  }
};

function transactionPrototype(body) {
  const {
    transactionDate,
    transactionPeriod,
    totalValue,
    individualValue,
    freightValue,
    itemName,
    itemDescription,
    itemUnits,
    transactionLocation,
    transactionType,
    transactionCategory,
    groupedItem,
    groupedItemsReference,
    transactionFiscalNote,
    transactionId,
    transactionStatus,
    companyName,
    companySellerName,
    companyCnpj,
    transactionOrigin,
  } = body;

  return {
    transactionDate,
    transactionPeriod,
    totalValue,
    individualValue,
    freightValue,
    itemName,
    itemDescription,
    itemUnits,
    transactionLocation,
    transactionType,
    transactionCategory,
    groupedItem,
    groupedItemsReference,
    transactionFiscalNote,
    transactionId,
    transactionStatus,
    companyName,
    companySellerName,
    companyCnpj,
    transactionOrigin,
  };
}

export {
  insertTransaction,
  findTransactionById,
  updateTransactionById,
  deleteTransactionById,
  findAllTransactionsInPeriod,
  removeAllTransactionsInPeriod,
  findUniquePeriods,
};

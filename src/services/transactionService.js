const mongoose = require('mongoose');
const logger = require('../config/logger.js');
const ObjectId = mongoose.Types.ObjectId;

const TransactionModel = require('../models/TransactionModel.js');

const insertTransaction = async (req, res) => {
  try {
    //
    let newTransactionJSON = transactionPrototype(req.body);
    const transaction = new TransactionModel(newTransactionJSON);
    await transaction.save();
    res.send(transaction);
    //
    //logger.info(`POST /transaction - ${JSON.stringify()}`);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algum erro ocorreu ao salvar transaction',
    });
    // logger.error(`POST /transaction - ${JSON.stringify(error.message)}`);
  }
};

const findTransactionById = async (req, res) => {
  let id = req.params.id;

  //condicao para o filtro no findAll
  /*let filter = name
    ? { name: { $regex: new RegExp(name), $options: 'i' } }
    : {};*/

  try {
    //
    const transaction = await TransactionModel.findById(id);

    if (!transaction) {
      return res.status(404).send({ message: 'Transaction não encontrada' });
    } else {
      res.send(transaction);
    }
    //
    //logger.info(`GET /transactions`);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao listar a transaction',
    });
    // logger.error(`GET /transactions - ${JSON.stringify(error.message)}`);
  }
};

const findAllTransactionsInPeriod = async (req, res) => {
  const period = req.params.transactionPeriod;

  try {
    //
    // let regex = new RegExp(req.params.id, 'i');
    let transaction;
    try {
      transaction = await TransactionModel.find({
        transactionPeriod: period,
      }).sort({
        day: 1,
      });
    } catch (error) {
      // logger.error(`GET /transactionsInPeriod - ${JSON.stringify(error.message)}`);
    }

    res.send(transaction);
    //
    //logger.info(`GET /transactionsInPeriod - ${period}`);
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Erro ao buscar transações do periodo: ' + period });
    // logger.error(`GET /transactionsInPeriod - ${JSON.stringify(error.message)}`);
  }
};

const updateTransactionById = async (req, res) => {
  const id = req.params.id;
  if (!req.body) {
    return res.status(400).send({
      message: 'Dados da transaction inexistente',
    });
  }

  let newTransactionJSON = transactionPrototype(req.body);

  let transaction = null;
  try {
    transaction = await TransactionModel.findByIdAndUpdate(
      id,
      newTransactionJSON
    );
    //
    res.send({ message: 'Transaction atualizada com sucesso' });

    //logger.info(`PUT /transaction - ${id} - ${JSON.stringify(req.body)}`);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao atualizar a transaction: ' + id });
    // logger.error(`PUT /transaction - ${JSON.stringify(error.message)}`);
  }
};

const deleteTransactionById = async (req, res) => {
  const id = req.params.id;

  try {
    //

    const transaction = await TransactionModel.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction não encontrada' });
    } else {
      res.send({ message: 'Transaction excluida com sucesso' });
    }
    //logger.info(`DELETE /transaction - ${id}`);
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Nao foi possivel deletar a transaction: ' + id });
    // logger.error(`DELETE /transaction - ${JSON.stringify(error.message)}`);
  }
};

const removeAllTransactionsInPeriod = async (req, res) => {
  const period = req.query.period;
  //condicao para o filtro no findAll
  let filter = period
    ? { name: { $regex: new RegExp(period), $options: 'i' } }
    : {};

  try {
    //
    //const transaction = await TransactionModel.deleteMany(filter);
    //
    res.send({
      message: `Transactions excluidos`,
    });
    //logger.info(`DELETE /transactions`);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao excluir todas as transactions do periodo: ' + period,
    });
    // logger.error(`DELETE /transactions - ${JSON.stringify(error.message)}`);
  }
};

const findUniquePeriods = async (req, res) => {
  let periods = req;

  try {
    try {
      periods = await TransactionModel.find({}) // campos retornados
        .distinct('transactionPeriod');
    } catch (error) {
      // logger.error(`GET /transactionsInPeriod - ${JSON.stringify(error.message)}`);
    }

    res.send(periods);
    //
    //logger.info(`GET /transactionsInPeriod - ${period}`);
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Erro ao buscar transações do periodo: ' + periods });
    // logger.error(`GET /transactionsInPeriod - ${JSON.stringify(error.message)}`);
  }
};

// helper functions
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

  let object = {
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

  return object;
}

function checkSingleDigit(number) {
  if (/^\d$/.test(number)) {
    return `0${number}`;
  }
  return number;
}

module.exports = {
  insertTransaction,
  findTransactionById,
  updateTransactionById,
  deleteTransactionById,
  findAllTransactionsInPeriod,
  removeAllTransactionsInPeriod,
  findUniquePeriods,
};

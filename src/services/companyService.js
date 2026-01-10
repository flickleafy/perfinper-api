import logger from '../config/logger.js';
import {
  insert,
  findById,
  findByCnpj,
  findByName,
  findByStatus,
  findByCity,
  findByState,
  findByCompanyType,
  findAll,
  updateById,
  updateByCnpj,
  deleteById,
  deleteByCnpj,
  deleteByIds,
  findDistinctStates,
  findDistinctCities,
  findDistinctCompanyTypes,
  getCompaniesWithoutCnpj,
  updateStatistics,
  findCompaniesByPrimaryActivity,
  findCompaniesBySecondaryActivity,
  upsertByCnpj,
  getCompanyStatistics,
} from '../repository/companyRepository.js';

export const insertCompany = async (req, res) => {
  try {
    const companyObject = req.body;
    const company = await insert(companyObject);
    res.send(company);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algum erro ocorreu ao salvar company',
    });
  }
};

export const createCompany = async (req, res) => {
  try {
    const companyObject = req.body;
    const company = await insert(companyObject);
    res.status(201).send(company);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algum erro ocorreu ao criar a company',
    });
  }
};

export const findCompanyById = async (req, res) => {
  const id = req.params.id;
  try {
    const company = await findById(id);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    } else {
      res.send(company);
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao listar a company',
    });
  }
};

export const findCompanyByCnpj = async (req, res) => {
  const cnpj = req.params.cnpj;
  try {
    const company = await findByCnpj(cnpj);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    } else {
      res.send(company);
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao buscar company por CNPJ',
    });
  }
};

export const findCompaniesByName = async (req, res) => {
  const name = req.params.name;
  try {
    const companies = await findByName(name);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar companies pelo nome: ' + name,
    });
  }
};

export const findCompaniesByStatus = async (req, res) => {
  const status = req.params.status;
  try {
    const companies = await findByStatus(status);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar companies pelo status: ' + status,
    });
  }
};

export const findCompaniesByCity = async (req, res) => {
  const city = req.params.city;
  try {
    const companies = await findByCity(city);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar companies pela cidade: ' + city,
    });
  }
};

export const findCompaniesByState = async (req, res) => {
  const state = req.params.state;
  try {
    const companies = await findByState(state);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar companies pelo estado: ' + state,
    });
  }
};

export const findCompaniesByType = async (req, res) => {
  const type = req.params.type;
  try {
    const companies = await findByCompanyType(type);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar companies pelo tipo: ' + type,
    });
  }
};

export const findAllCompanies = async (req, res) => {
  try {
    const companies = await findAll();
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao buscar todas as companies',
    });
  }
};

export const updateCompanyById = async (req, res) => {
  const id = req.params.id;
  if (!req.body) {
    return res.status(400).send({
      message: 'Dados da company inexistente',
    });
  }

  const companyObject = req.body;
  try {
    const company = await updateById(id, companyObject);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    }
    res.send({ message: 'Company atualizada com sucesso' });
  } catch (error) {
    res.status(500).send({ message: 'Erro ao atualizar a company: ' + id });
  }
};

export const updateCompanyByCnpj = async (req, res) => {
  const cnpj = req.params.cnpj;
  if (!req.body) {
    return res.status(400).send({
      message: 'Dados da company inexistente',
    });
  }

  const companyObject = req.body;
  try {
    const company = await updateByCnpj(cnpj, companyObject);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    }
    res.send({ message: 'Company atualizada com sucesso' });
  } catch (error) {
    res.status(500).send({ message: 'Erro ao atualizar a company: ' + cnpj });
  }
};

export const upsertCompanyByCnpj = async (req, res) => {
  const cnpj = req.params.cnpj;
  if (!req.body) {
    return res.status(400).send({
      message: 'Dados da company inexistente',
    });
  }

  const companyObject = req.body;
  try {
    const company = await upsertByCnpj(cnpj, companyObject);
    res.send({
      message: 'Company criada/atualizada com sucesso',
      company: company,
    });
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao criar/atualizar a company: ' + cnpj,
      error: error.message,
    });
  }
};

export const deleteCompanyById = async (req, res) => {
  const id = req.params.id;
  try {
    const company = await deleteById(id);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    } else {
      res.send({ message: 'Company excluída com sucesso' });
    }
  } catch (error) {
    res.status(500).send({
      message: 'Não foi possível deletar a company: ' + id,
    });
  }
};

export const deleteCompanyByCnpj = async (req, res) => {
  const cnpj = req.params.cnpj;
  try {
    const company = await deleteByCnpj(cnpj);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    } else {
      res.send({ message: 'Company excluída com sucesso' });
    }
  } catch (error) {
    res.status(500).send({
      message: 'Não foi possível deletar a company: ' + cnpj,
    });
  }
};

export const deleteCompaniesByIds = async (req, res) => {
  const ids = req.body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).send({
      message: 'IDs inválidos: deve ser um array não vazio',
    });
  }

  try {
    const result = await deleteByIds(ids);
    res.send({
      message: `${result.deletedCount} companies excluídas com sucesso`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao excluir companies pelos IDs',
    });
  }
};

export const findUniqueStates = async (req, res) => {
  try {
    const states = await findDistinctStates();
    res.send(states);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar estados' });
  }
};

export const findUniqueCities = async (req, res) => {
  try {
    const cities = await findDistinctCities();
    res.send(cities);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar cidades' });
  }
};

export const findUniqueCompanyTypes = async (req, res) => {
  try {
    const types = await findDistinctCompanyTypes();
    res.send(types);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar tipos de companies' });
  }
};

export const findCompaniesWithoutCnpj = async (req, res) => {
  try {
    const companies = await getCompaniesWithoutCnpj();
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar companies sem CNPJ',
    });
  }
};

export const updateCompanyStatistics = async (req, res) => {
  const cnpj = req.params.cnpj;
  const statistics = req.body.statistics;

  if (!statistics) {
    return res.status(400).send({
      message: 'Estatísticas não fornecidas',
    });
  }

  try {
    const company = await updateStatistics(cnpj, statistics);
    if (!company) {
      return res.status(404).send({ message: 'Company não encontrada' });
    }
    res.send({ message: 'Estatísticas da company atualizadas com sucesso' });
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao atualizar estatísticas da company: ' + cnpj,
    });
  }
};

export const findCompaniesByPrimaryActivityCode = async (req, res) => {
  const activityCode = req.params.activityCode;
  try {
    const companies = await findCompaniesByPrimaryActivity(activityCode);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message:
        'Erro ao buscar companies pela atividade principal: ' + activityCode,
    });
  }
};

export const findCompaniesBySecondaryActivityCode = async (req, res) => {
  const activityCode = req.params.activityCode;
  try {
    const companies = await findCompaniesBySecondaryActivity(activityCode);
    res.send(companies);
  } catch (error) {
    res.status(500).send({
      message:
        'Erro ao buscar companies pela atividade secundária: ' + activityCode,
    });
  }
};

export const getOverallCompanyStatistics = async (req, res) => {
  try {
    const statistics = await getCompanyStatistics();
    res.send(statistics);
  } catch (error) {
    res.status(500).send({
      message: 'Erro ao buscar estatísticas gerais das companies',
    });
  }
};

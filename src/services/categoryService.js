import logger from '../config/logger.js';

import {
  insert,
  findById,
  updateById,
  deleteById,
  findAll,
} from '../repository/categoryRepository.js';
import { categoryPrototype } from './prototype/categoryPrototype.js';

export const insertCategory = async (req, res) => {
  try {
    const categoryObject = categoryPrototype(req.body);
    const category = await insert(categoryObject);
    res.send(category);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Algum erro ocorreu ao salvar category',
    });
  }
};

export const findCategoryById = async (req, res) => {
  const id = req.params.id;

  try {
    const category = await findById(id);
    if (!category) {
      return res.status(404).send({ message: 'Category não encontrada' });
    } else {
      res.send(category);
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erro ao listar a category',
    });
  }
};

export const updateCategoryById = async (req, res) => {
  const id = req.params.id;
  if (!req.body) {
    return res.status(400).send({
      message: 'Dados da categoria inexistente',
    });
  }

  const categoryObject = categoryPrototype(req.body);

  try {
    const updatedCategory = await updateById(id, categoryObject);
    if (!updatedCategory) {
      return res.status(404).send({ message: 'Category não encontrada' });
    }
    res.send({ message: 'Category atualizada com sucesso' });
  } catch (error) {
    res.status(500).send({ message: 'Erro ao atualizar a category: ' + id });
  }
};

export const deleteCategoryById = async (req, res) => {
  const id = req.params.id;

  try {
    const deletedCategory = await deleteById(id);
    if (!deletedCategory) {
      return res.status(404).send({ message: 'Category não encontrada' });
    } else {
      res.send({ message: 'Category excluida com sucesso' });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Nao foi possivel deletar a category: ' + id });
  }
};

export const findAllCategories = async (req, res) => {
  try {
    const categories = await findAll();
    res.send(categories);
  } catch (error) {
    res.status(500).send({ message: 'Erro ao buscar categories' });
  }
};

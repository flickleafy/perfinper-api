import logger from '../config/logger.js';
import {
  insert,
  findById,
  findByCpf,
  findByName,
  findByStatus,
  findByCity,
  findAll,
  updateById,
  updateByCpf,
  deleteById,
  count,
  getStatistics,
} from '../repository/personRepository.js';

/**
 * Person Service
 * Handles all HTTP operations for Person entities (CPF holders)
 */

/**
 * Insert a new person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const insertPerson = async (req, res) => {
  try {
    const person = await insert(req.body);
    res.status(201).send(person);
  } catch (error) {
    logger.error('Error inserting person:', error);
    res.status(400).send({ message: error.message });
  }
};

/**
 * Find person by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPersonById = async (req, res) => {
  try {
    const person = await findById(req.params.id);
    if (!person) {
      return res.status(404).send({ message: 'Person not found' });
    }
    res.send(person);
  } catch (error) {
    logger.error('Error finding person by ID:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find person by CPF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPersonByCpf = async (req, res) => {
  try {
    const person = await findByCpf(req.params.cpf);
    if (!person) {
      return res.status(404).send({ message: 'Person not found' });
    }
    res.send(person);
  } catch (error) {
    logger.error('Error finding person by CPF:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find people by name (partial match)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleByName = async (req, res) => {
  try {
    const people = await findByName(req.params.name);
    res.send(people);
  } catch (error) {
    logger.error('Error finding people by name:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find people by status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleByStatus = async (req, res) => {
  try {
    const people = await findByStatus(req.params.status);
    res.send(people);
  } catch (error) {
    logger.error('Error finding people by status:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find people by city
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleByCity = async (req, res) => {
  try {
    const people = await findByCity(req.params.city);
    res.send(people);
  } catch (error) {
    logger.error('Error finding people by city:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find all people
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findAllPeople = async (req, res) => {
  try {
    const people = await findAll();
    res.send(people);
  } catch (error) {
    logger.error('Error finding all people:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Update person by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePersonById = async (req, res) => {
  try {
    const person = await updateById(req.params.id, req.body);
    if (!person) {
      return res.status(404).send({ message: 'Person not found' });
    }
    res.send(person);
  } catch (error) {
    logger.error('Error updating person by ID:', error);
    res.status(400).send({ message: error.message });
  }
};

/**
 * Update person by CPF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePersonByCpf = async (req, res) => {
  try {
    const person = await updateByCpf(req.params.cpf, req.body);
    if (!person) {
      return res.status(404).send({ message: 'Person not found' });
    }
    res.send(person);
  } catch (error) {
    logger.error('Error updating person by CPF:', error);
    res.status(400).send({ message: error.message });
  }
};

/**
 * Delete person by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deletePersonById = async (req, res) => {
  try {
    const person = await deleteById(req.params.id);
    if (!person) {
      return res.status(404).send({ message: 'Person not found' });
    }
    res.send({ message: 'Person deleted successfully', person });
  } catch (error) {
    logger.error('Error deleting person by ID:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Get person statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPersonStatistics = async (req, res) => {
  try {
    const stats = await getStatistics();
    res.send(stats);
  } catch (error) {
    logger.error('Error getting person statistics:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Get total count of people
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPersonCount = async (req, res) => {
  try {
    const totalCount = await count();
    res.send({ count: totalCount });
  } catch (error) {
    logger.error('Error getting person count:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

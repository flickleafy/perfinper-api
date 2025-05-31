import logger from '../config/logger.js';
import {
  insert,
  findById,
  findByCpf,
  findByName,
  findByStatus,
  findByCity,
  findByBusinessType,
  findByBusinessCategory,
  findWithPersonalBusiness,
  findFormalizedBusinesses,
  findInformalBusinesses,
  getDistinctBusinessTypes,
  getDistinctBusinessCategories,
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

/**
 * Find people by business type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleByBusinessType = async (req, res) => {
  try {
    const people = await findByBusinessType(req.params.businessType);
    res.send(people);
  } catch (error) {
    logger.error('Error finding people by business type:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find people by business category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleByBusinessCategory = async (req, res) => {
  try {
    const people = await findByBusinessCategory(req.params.businessCategory);
    res.send(people);
  } catch (error) {
    logger.error('Error finding people by business category:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find people with personal business
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleWithPersonalBusiness = async (req, res) => {
  try {
    const people = await findWithPersonalBusiness();
    res.send(people);
  } catch (error) {
    logger.error('Error finding people with personal business:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find formalized businesses (MEI)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleFormalizedBusinesses = async (req, res) => {
  try {
    const people = await findFormalizedBusinesses();
    res.send(people);
  } catch (error) {
    logger.error('Error finding formalized businesses:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Find informal businesses (not MEI)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const findPeopleInformalBusinesses = async (req, res) => {
  try {
    const people = await findInformalBusinesses();
    res.send(people);
  } catch (error) {
    logger.error('Error finding informal businesses:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Get distinct business types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPersonDistinctBusinessTypes = async (req, res) => {
  try {
    const businessTypes = await getDistinctBusinessTypes();
    res.send(businessTypes);
  } catch (error) {
    logger.error('Error getting distinct business types:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

/**
 * Get distinct business categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPersonDistinctBusinessCategories = async (req, res) => {
  try {
    const businessCategories = await getDistinctBusinessCategories();
    res.send(businessCategories);
  } catch (error) {
    logger.error('Error getting distinct business categories:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

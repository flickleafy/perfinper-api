import PersonModel from '../models/PersonModel.js';

/**
 * Person Repository
 * Handles all database operations for Person entities with MongoDB session support
 */

/**
 * Find all people with optional filtering
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - Query options (limit, skip, sort)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findAll(filter = {}, options = {}, session = null) {
  const query = PersonModel.find(filter);

  if (session) {
    query.session(session);
  }

  if (options.limit) query.limit(options.limit);
  if (options.skip) query.skip(options.skip);
  if (options.sort) query.sort(options.sort);

  return await query.exec();
}

/**
 * Find person by ID
 * @param {string} id - Person ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Person document or null
 */
async function findById(id, session = null) {
  const query = PersonModel.findById(id);

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find person by CPF
 * @param {string} cpf - CPF to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Person document or null
 */
async function findByCpf(cpf, session = null) {
  const query = PersonModel.findOne({ cpf });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find people by name (partial match)
 * @param {string} name - Name to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findByName(name, session = null) {
  const query = PersonModel.find({
    fullName: { $regex: name, $options: 'i' },
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find people by city
 * @param {string} city - City to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findByCity(city, session = null) {
  const query = PersonModel.find({
    'address.city': { $regex: city, $options: 'i' },
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Insert a new person
 * @param {Object} personData - Person data to insert
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Created person document
 */
async function insert(personData, session = null) {
  const person = new PersonModel(personData);

  if (session) {
    return await person.save({ session });
  }

  return await person.save();
}

/**
 * Update person by ID
 * @param {string} id - Person ID
 * @param {Object} updateData - Data to update
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated person document or null
 */
async function updateById(id, updateData, session = null) {
  const options = { new: true, runValidators: true };

  if (session) {
    options.session = session;
  }

  return await PersonModel.findByIdAndUpdate(id, updateData, options);
}

/**
 * Update person by CPF
 * @param {string} cpf - CPF to find person
 * @param {Object} updateData - Data to update
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Updated person document or null
 */
async function updateByCpf(cpf, updateData, session = null) {
  const options = { new: true, runValidators: true };

  if (session) {
    options.session = session;
  }

  return await PersonModel.findOneAndUpdate({ cpf }, updateData, options);
}

/**
 * Delete person by ID
 * @param {string} id - Person ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object|null>} Deleted person document or null
 */
async function deleteById(id, session = null) {
  const options = {};

  if (session) {
    options.session = session;
  }

  return await PersonModel.findByIdAndDelete(id, options);
}

/**
 * Count people with optional filter
 * @param {Object} filter - MongoDB filter object
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<number>} Count of matching documents
 */
async function count(filter = {}, session = null) {
  const query = PersonModel.countDocuments(filter);

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find people by status
 * @param {string} status - Status to filter by
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findByStatus(status, session = null) {
  const query = PersonModel.find({ status });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Get statistics about people
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} Statistics object
 */
async function getStatistics(session = null) {
  const pipeline = [
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
        },
        blocked: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
        },
      },
    },
  ];

  const query = PersonModel.aggregate(pipeline);

  if (session) {
    query.session(session);
  }

  const result = await query.exec();

  return (
    result[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0,
    }
  );
}

export {
  findAll,
  findById,
  findByCpf,
  findByName,
  findByCity,
  findByStatus,
  insert,
  updateById,
  updateByCpf,
  deleteById,
  count,
  getStatistics,
};

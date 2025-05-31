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
 * Find people by business type
 * @param {string} businessType - Business type to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findByBusinessType(businessType, session = null) {
  const query = PersonModel.find({
    'personalBusiness.businessType': businessType,
    'personalBusiness.hasPersonalBusiness': true,
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find people by business category
 * @param {string} businessCategory - Business category to search for
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findByBusinessCategory(businessCategory, session = null) {
  const query = PersonModel.find({
    'personalBusiness.businessCategory': businessCategory,
    'personalBusiness.hasPersonalBusiness': true,
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find people with personal business
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findWithPersonalBusiness(session = null) {
  const query = PersonModel.find({
    'personalBusiness.hasPersonalBusiness': true,
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find formalized businesses (MEI)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findFormalizedBusinesses(session = null) {
  const query = PersonModel.find({
    'personalBusiness.hasPersonalBusiness': true,
    'personalBusiness.isFormalized': true,
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Find informal businesses (not MEI)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of person documents
 */
async function findInformalBusinesses(session = null) {
  const query = PersonModel.find({
    'personalBusiness.hasPersonalBusiness': true,
    'personalBusiness.isFormalized': false,
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Get distinct business types
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of distinct business types
 */
async function getDistinctBusinessTypes(session = null) {
  const query = PersonModel.distinct('personalBusiness.businessType', {
    'personalBusiness.hasPersonalBusiness': true,
  });

  if (session) {
    query.session(session);
  }

  return await query.exec();
}

/**
 * Get distinct business categories
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Array>} Array of distinct business categories
 */
async function getDistinctBusinessCategories(session = null) {
  const query = PersonModel.distinct('personalBusiness.businessCategory', {
    'personalBusiness.hasPersonalBusiness': true,
  });

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
        withPersonalBusiness: {
          $sum: {
            $cond: [
              { $eq: ['$personalBusiness.hasPersonalBusiness', true] },
              1,
              0,
            ],
          },
        },
        formalizedBusinesses: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$personalBusiness.hasPersonalBusiness', true] },
                  { $eq: ['$personalBusiness.isFormalized', true] },
                ],
              },
              1,
              0,
            ],
          },
        },
        informalBusinesses: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$personalBusiness.hasPersonalBusiness', true] },
                  { $eq: ['$personalBusiness.isFormalized', false] },
                ],
              },
              1,
              0,
            ],
          },
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
      withPersonalBusiness: 0,
      formalizedBusinesses: 0,
      informalBusinesses: 0,
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
  findByBusinessType,
  findByBusinessCategory,
  findWithPersonalBusiness,
  findFormalizedBusinesses,
  findInformalBusinesses,
  getDistinctBusinessTypes,
  getDistinctBusinessCategories,
  insert,
  updateById,
  updateByCpf,
  deleteById,
  count,
  getStatistics,
};

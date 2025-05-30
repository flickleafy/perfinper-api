import CompanyModel from '../models/CompanyModel.js';
import { startSession } from 'mongoose';

export async function findAll() {
  try {
    return await CompanyModel.find().sort({ companyName: 1 });
  } catch (error) {
    console.error('Error in findAll:', error.message);
    throw new Error('Failed to retrieve all companies.');
  }
}

export async function findById(id, session = null) {
  try {
    let company;
    if (session) {
      company = await CompanyModel.findById(id, { session });
    } else {
      company = await CompanyModel.findById(id);
    }
    if (!company) {
      return null;
    }
    return company;
  } catch (error) {
    console.error('Error in findById:', error.message);
    throw new Error('An error occurred while finding the company by ID.');
  }
}

export async function findByCnpj(cnpj, session = null) {
  try {
    let company;
    if (session) {
      company = await CompanyModel.findOne({ companyCnpj: cnpj }).session(
        session
      );
    } else {
      company = await CompanyModel.findOne({ companyCnpj: cnpj });
    }
    return company;
  } catch (error) {
    console.error('Error in findByCnpj:', error.message);
    throw new Error('An error occurred while finding the company by CNPJ.');
  }
}

export async function findByName(name) {
  try {
    const regex = new RegExp(name, 'i'); // Case-insensitive search
    const companies = await CompanyModel.find({
      $or: [
        { companyName: regex },
        { corporateName: regex },
        { tradeName: regex },
      ],
    }).sort({ companyName: 1 });
    return companies;
  } catch (error) {
    console.error('Error in findByName:', error.message);
    throw new Error('An error occurred while finding companies by name.');
  }
}

export async function findByStatus(status) {
  try {
    const companies = await CompanyModel.find({ status }).sort({
      companyName: 1,
    });
    return companies;
  } catch (error) {
    console.error('Error in findByStatus:', error.message);
    throw new Error('Failed to find companies with the specified status.');
  }
}

export async function findByCity(city) {
  try {
    const regex = new RegExp(city, 'i');
    const companies = await CompanyModel.find({
      'address.city': regex,
    }).sort({ companyName: 1 });
    return companies;
  } catch (error) {
    console.error('Error in findByCity:', error.message);
    throw new Error('Failed to find companies in the specified city.');
  }
}

export async function findByState(state) {
  try {
    const regex = new RegExp(state, 'i');
    const companies = await CompanyModel.find({
      'address.state': regex,
    }).sort({ companyName: 1 });
    return companies;
  } catch (error) {
    console.error('Error in findByState:', error.message);
    throw new Error('Failed to find companies in the specified state.');
  }
}

export async function findByCompanyType(type) {
  try {
    const companies = await CompanyModel.find({ companyType: type }).sort({
      companyName: 1,
    });
    return companies;
  } catch (error) {
    console.error('Error in findByCompanyType:', error.message);
    throw new Error('Failed to find companies with the specified type.');
  }
}

export async function insert(companyObject, session = null) {
  try {
    const company = new CompanyModel(companyObject);
    if (session) {
      await company.save({ session });
    } else {
      await company.save();
    }
    return company;
  } catch (error) {
    console.error('Error in insert:', error.message);
    throw new Error('An error occurred while inserting the company.');
  }
}

export async function updateById(id, companyObject) {
  try {
    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      id,
      companyObject,
      { new: true }
    );
    if (!updatedCompany) {
      return null;
    }
    return updatedCompany;
  } catch (error) {
    console.error('Error in updateById:', error.message);
    throw new Error('An error occurred while updating the company by ID.');
  }
}

export async function updateByCnpj(cnpj, companyObject) {
  try {
    const updatedCompany = await CompanyModel.findOneAndUpdate(
      { companyCnpj: cnpj },
      companyObject,
      { new: true }
    );
    if (!updatedCompany) {
      return null;
    }
    return updatedCompany;
  } catch (error) {
    console.error('Error in updateByCnpj:', error.message);
    throw new Error('An error occurred while updating the company by CNPJ.');
  }
}

export async function deleteById(id, session = null) {
  try {
    let company;
    if (session) {
      company = await CompanyModel.findByIdAndDelete(id, { session });
    } else {
      company = await CompanyModel.findByIdAndDelete(id);
    }
    if (!company) {
      return null;
    }
    return company;
  } catch (error) {
    console.error('Error in deleteById:', error.message);
    throw new Error('An error occurred while deleting the company by ID.');
  }
}

export async function deleteByCnpj(cnpj) {
  try {
    const company = await CompanyModel.findOneAndDelete({ companyCnpj: cnpj });
    if (!company) {
      return null;
    }
    return company;
  } catch (error) {
    console.error('Error in deleteByCnpj:', error.message);
    throw new Error('An error occurred while deleting the company by CNPJ.');
  }
}

export async function deleteByIds(ids) {
  try {
    // Validate that the input is an array and has at least one ID
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid input: ids must be a non-empty array.');
    }

    // Delete all companies that have an ID in the ids array
    const result = await CompanyModel.deleteMany({
      _id: { $in: ids },
    });

    // Check if any documents were deleted
    if (result.deletedCount === 0) {
      throw new Error('No companies found with the given IDs.');
    }

    return result;
  } catch (error) {
    console.error('Error in deleteByIds:', error.message);
    throw new Error('An error occurred while deleting the companies by IDs.');
  }
}

export async function findDistinctStates() {
  try {
    return await CompanyModel.distinct('address.state');
  } catch (error) {
    console.error('Error in findDistinctStates:', error.message);
    throw new Error('Failed to retrieve distinct states.');
  }
}

export async function findDistinctCities() {
  try {
    return await CompanyModel.distinct('address.city');
  } catch (error) {
    console.error('Error in findDistinctCities:', error.message);
    throw new Error('Failed to retrieve distinct cities.');
  }
}

export async function findDistinctCompanyTypes() {
  try {
    return await CompanyModel.distinct('companyType');
  } catch (error) {
    console.error('Error in findDistinctCompanyTypes:', error.message);
    throw new Error('Failed to retrieve distinct company types.');
  }
}

export async function getCompaniesWithoutCnpj() {
  try {
    const companies = await CompanyModel.find({
      $or: [
        { companyCnpj: null },
        { companyCnpj: { $exists: false } },
        { companyCnpj: '' },
        { companyCnpj: { $type: 10 } }, // undefined
      ],
    })
      .sort({ companyName: 1 })
      .select('_id companyName');

    return companies;
  } catch (error) {
    console.error('Error in getCompaniesWithoutCnpj:', error.message);
    throw new Error(
      'An error occurred while retrieving companies without CNPJ.'
    );
  }
}

export async function updateStatistics(cnpj, statistics) {
  try {
    const updatedCompany = await CompanyModel.findOneAndUpdate(
      { companyCnpj: cnpj },
      { statistics: statistics },
      { new: true }
    );
    if (!updatedCompany) {
      return null;
    }
    return updatedCompany;
  } catch (error) {
    console.error('Error in updateStatistics:', error.message);
    throw new Error('An error occurred while updating company statistics.');
  }
}

export async function findCompaniesByPrimaryActivity(activityCode) {
  try {
    const companies = await CompanyModel.find({
      'activities.primary.code': activityCode,
    }).sort({ companyName: 1 });
    return companies;
  } catch (error) {
    console.error('Error in findCompaniesByPrimaryActivity:', error.message);
    throw new Error(
      'Failed to find companies with the specified primary activity.'
    );
  }
}

export async function findCompaniesBySecondaryActivity(activityCode) {
  try {
    const companies = await CompanyModel.find({
      'activities.secondary.code': activityCode,
    }).sort({ companyName: 1 });
    return companies;
  } catch (error) {
    console.error('Error in findCompaniesBySecondaryActivity:', error.message);
    throw new Error(
      'Failed to find companies with the specified secondary activity.'
    );
  }
}

export async function upsertByCnpj(cnpj, companyObject) {
  try {
    const updatedCompany = await CompanyModel.findOneAndUpdate(
      { companyCnpj: cnpj },
      companyObject,
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );
    return updatedCompany;
  } catch (error) {
    console.error('Error in upsertByCnpj:', error.message);
    throw new Error('An error occurred while upserting the company by CNPJ.');
  }
}

export async function getCompanyStatistics() {
  try {
    const stats = await CompanyModel.aggregate([
      {
        $group: {
          _id: null,
          totalCompanies: { $sum: 1 },
          activeCompanies: {
            $sum: { $cond: [{ $eq: ['$status', 'Ativa'] }, 1, 0] },
          },
          companiesByType: {
            $push: '$companyType',
          },
          companiesByState: {
            $push: '$address.state',
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalCompanies: 1,
          activeCompanies: 1,
          companiesByType: 1,
          companiesByState: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalCompanies: 0,
        activeCompanies: 0,
        companiesByType: [],
        companiesByState: [],
      }
    );
  } catch (error) {
    console.error('Error in getCompanyStatistics:', error.message);
    throw new Error('Failed to retrieve company statistics.');
  }
}

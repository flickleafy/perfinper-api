import express from 'express';
import {
  findAllCompanies,
  findCompanyById,
  findCompanyByCnpj,
  findCompaniesByName,
  findCompaniesByStatus,
  findCompaniesByCity,
  findCompaniesByState,
  findCompaniesByPrimaryActivityCode,
  findCompaniesBySecondaryActivityCode,
  findCompaniesByType,
  createCompany,
  updateCompanyById,
  updateCompanyByCnpj,
  upsertCompanyByCnpj,
  deleteCompanyById,
  deleteCompanyByCnpj,
  deleteCompaniesByIds,
  getOverallCompanyStatistics,
  findUniqueStates,
  findUniqueCities,
  findUniqueCompanyTypes,
  findCompaniesWithoutCnpj,
  updateCompanyStatistics,
} from '../services/companyService.js';

const router = express.Router();

// GET routes
router.get('/', findAllCompanies);
router.get('/statistics', getOverallCompanyStatistics);
router.get('/cnpj/:cnpj', findCompanyByCnpj);
router.get('/name/:name', findCompaniesByName);
router.get('/status/:status', findCompaniesByStatus);
router.get('/city/:city', findCompaniesByCity);
router.get('/state/:state', findCompaniesByState);
router.get('/type/:type', findCompaniesByType);
router.get(
  '/activity/primary/:activityCode',
  findCompaniesByPrimaryActivityCode
);
router.get(
  '/activity/secondary/:activityCode',
  findCompaniesBySecondaryActivityCode
);
router.get('/meta/states', findUniqueStates);
router.get('/meta/cities', findUniqueCities);
router.get('/meta/types', findUniqueCompanyTypes);
router.get('/query/without-cnpj', findCompaniesWithoutCnpj);
router.get('/:id', findCompanyById);

// POST routes
router.post('/', createCompany);
router.post('/upsert/cnpj/:cnpj', upsertCompanyByCnpj);
router.post('/delete/batch', deleteCompaniesByIds);

// PUT routes
router.put('/:id', updateCompanyById);
router.put('/cnpj/:cnpj', updateCompanyByCnpj);
router.put('/statistics/cnpj/:cnpj', updateCompanyStatistics);

// DELETE routes
router.delete('/:id', deleteCompanyById);
router.delete('/cnpj/:cnpj', deleteCompanyByCnpj);

export default router;

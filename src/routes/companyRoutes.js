import express from 'express';
import {
  getAllCompanies,
  getCompanyById,
  getCompaniesByCnpj,
  getCompaniesByName,
  getCompaniesByStatus,
  getCompaniesByCity,
  getCompaniesByState,
  getCompaniesByActivity,
  createCompany,
  updateCompany,
  deleteCompany,
  bulkCreateCompanies,
  bulkUpdateCompanies,
  getCompanyStatistics,
  getCompaniesCount,
  searchCompanies,
} from '../services/companyService.js';

const router = express.Router();

// GET routes
router.get('/', getAllCompanies);
router.get('/search', searchCompanies);
router.get('/statistics', getCompanyStatistics);
router.get('/count', getCompaniesCount);
router.get('/cnpj/:cnpj', getCompaniesByCnpj);
router.get('/name/:name', getCompaniesByName);
router.get('/status/:status', getCompaniesByStatus);
router.get('/city/:city', getCompaniesByCity);
router.get('/state/:state', getCompaniesByState);
router.get('/activity/:activity', getCompaniesByActivity);
router.get('/:id', getCompanyById);

// POST routes
router.post('/', createCompany);
router.post('/bulk', bulkCreateCompanies);

// PUT routes
router.put('/bulk', bulkUpdateCompanies);
router.put('/:id', updateCompany);

// DELETE routes
router.delete('/:id', deleteCompany);

export default router;

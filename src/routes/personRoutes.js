import express from 'express';
import {
  insertPerson,
  findPersonById,
  findPersonByCpf,
  findPeopleByName,
  findPeopleByStatus,
  findPeopleByCity,
  findAllPeople,
  updatePersonById,
  updatePersonByCpf,
  deletePersonById,
  getPersonStatistics,
  getPersonCount,
  findPeopleByBusinessType,
  findPeopleByBusinessCategory,
  findPeopleWithPersonalBusiness,
  findPeopleFormalizedBusinesses,
  findPeopleInformalBusinesses,
  getPersonDistinctBusinessTypes,
  getPersonDistinctBusinessCategories,
} from '../services/personService.js';

const router = express.Router();

// Person CRUD operations
router.post('/', insertPerson);
router.get('/', findAllPeople);
router.get('/count', getPersonCount);
router.get('/statistics', getPersonStatistics);
router.get('/id/:id', findPersonById);
router.get('/cpf/:cpf', findPersonByCpf);
router.get('/name/:name', findPeopleByName);
router.get('/status/:status', findPeopleByStatus);
router.get('/city/:city', findPeopleByCity);

// Personal business routes
router.get('/business/all', findPeopleWithPersonalBusiness);
router.get('/business/formalized', findPeopleFormalizedBusinesses);
router.get('/business/informal', findPeopleInformalBusinesses);
router.get('/business/type/:businessType', findPeopleByBusinessType);
router.get(
  '/business/category/:businessCategory',
  findPeopleByBusinessCategory
);
router.get('/business/types/distinct', getPersonDistinctBusinessTypes);
router.get(
  '/business/categories/distinct',
  getPersonDistinctBusinessCategories
);

// Update and delete operations
router.put('/id/:id', updatePersonById);
router.put('/cpf/:cpf', updatePersonByCpf);
router.delete('/id/:id', deletePersonById);

export default router;

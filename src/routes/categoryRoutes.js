import express from 'express';
import {
  deleteCategoryById,
  findAllCategories,
  findCategoryById,
  insertCategory,
  updateCategoryById,
} from '../services/categoryService.js';

const categoryRouter = express.Router();

categoryRouter.post('/', insertCategory);
categoryRouter.get('/:id', findCategoryById);
categoryRouter.put('/:id', updateCategoryById);
categoryRouter.delete('/:id', deleteCategoryById);

categoryRouter.get('/all/itens', findAllCategories);

export default categoryRouter;

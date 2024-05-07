import express from 'express';
import * as categoryService from '../services/categoryService.js';

const categoryRouter = express.Router();

categoryRouter.post('/', categoryService.insertCategory);
categoryRouter.get('/:id', categoryService.findCategoryById);
categoryRouter.put('/:id', categoryService.updateCategoryById);
categoryRouter.delete('/:id', categoryService.deleteCategoryById);

categoryRouter.get('/all/itens', categoryService.findAllCategories);

export default categoryRouter;

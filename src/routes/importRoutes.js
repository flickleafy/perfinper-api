import express from 'express';
import {
  nubankImporter,
  flashImporter,
  mercadolivreImporter,
} from '../services/importService.js';

const importRouter = express.Router();

importRouter.post('/nubank', nubankImporter);
importRouter.post('/flash', flashImporter);
importRouter.post('/mercadolivre', mercadolivreImporter);

export default importRouter;

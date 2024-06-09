import express from 'express';
import {
  nubankImporter,
  flashImporter,
  mercadolivreImporter,
  nubankCreditImporter,
  digioCreditImporter,
} from '../services/importService.js';

const importRouter = express.Router();

importRouter.post('/nubank', nubankImporter);
importRouter.post('/nubank-credit', nubankCreditImporter);
importRouter.post('/digio-credit', digioCreditImporter);
importRouter.post('/flash', flashImporter);
importRouter.post('/mercadolivre', mercadolivreImporter);

export default importRouter;

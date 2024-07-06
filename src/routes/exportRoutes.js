import express from 'express';
import { transactionsExporterService } from '../services/exportService.js';

const exportRoutes = express.Router();

exportRoutes.get('/transactions/:year', transactionsExporterService);

export default exportRoutes;

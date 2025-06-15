import express from 'express';
import { transactionsExporterService } from '../services/exportService.js';
import * as fiscalBookExporter from '../services/exporter/fiscalBookExporter.js';

const exportRoutes = express.Router();

exportRoutes.get('/transactions/:year', transactionsExporterService);

// Fiscal Book export routes
exportRoutes.get('/fiscal-book/:id/csv', async (req, res) => {
  try {
    const includeTransactions = req.query.transactions !== 'false';
    const { csv, filename } = await fiscalBookExporter.exportFiscalBookToCSV(
      req.params.id,
      includeTransactions
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting fiscal book to CSV:', error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

exportRoutes.get('/fiscal-book/:id/json', async (req, res) => {
  try {
    const includeTransactions = req.query.transactions !== 'false';
    const { json, filename } = await fiscalBookExporter.exportFiscalBookToJSON(
      req.params.id,
      includeTransactions
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(json);
  } catch (error) {
    console.error('Error exporting fiscal book to JSON:', error);
    if (error.message === 'Fiscal book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default exportRoutes;

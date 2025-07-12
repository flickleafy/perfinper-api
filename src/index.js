import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import personRoutes from './routes/personRoutes.js';
import importRoutes from './routes/importRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import fiscalBookRoutes from './routes/fiscalBookRoutes.js';
import snapshotRoutes from './routes/snapshotRoutes.js';
import dotenv from 'dotenv';
import { initializeDatabase } from './services/initializationService.js';
import {
  // identifyAndUpdateCompanyFields,
  // migrateCompanyDataToCompanyCollection,
  migrateTransactionsToFiscalBooks,
} from './services/migrationService/index.js';

// Initialize dotenv to read .env files
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Route definitions
app.get('/api/', (_, response) => {
  response.send({
    message: 'Welcome to the API. Access /transaction for more information.',
  });
});

app.use('/api/transaction', transactionRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/person', personRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/fiscal-book', fiscalBookRoutes);
app.use('/api', snapshotRoutes); // Snapshot routes under /api

/**
 * Database Connection Setup
 */
const { DB_CONNECTION } = process.env;

console.log('Initiating MongoDB connection...');
const connectDB = async () => {
  try {
    await mongoose.connect(DB_CONNECTION);
    console.log('Connected to MongoDB');

    // Server Initialization
    const APP_PORT = process.env.PORT || 3001;
    app.listen(APP_PORT, () => {
      console.log(`Server running on port ${APP_PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

const initialize = async () => {
  // Initiate the connection
  await connectDB();
  await initializeDatabase();
  // await identifyAndUpdateCompanyFields();
  // await migrateCompanyDataToCompanyCollection(false);
  // await migrateTransactionsToFiscalBooks();
};

initialize();

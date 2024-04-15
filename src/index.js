const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/routes.js');
const dotenv = require('dotenv');

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

app.use('/api/transaction', routes);

/**
 * Database Connection Setup
 */
const { DB_CONNECTION } = process.env;

console.log('Initiating MongoDB connection...');
const connectDB = async () => {
  try {
    await mongoose.connect(DB_CONNECTION, {});
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

// Initiate the connection
connectDB();

# Personal Finance Helper API (perfinper-api)

A comprehensive RESTful API for personal finance management built with Node.js, Express, and MongoDB. This API provides endpoints for managing financial transactions, categories, and data import/export functionality with support for multiple financial institutions.

## 🚀 Features

- **Transaction Management**: Create, read, update, and delete financial transactions
- **Category Management**: Organize transactions with customizable categories
- **Multi-Source Data Import**: Import transactions from various financial institutions:
  - Nubank (debit and credit)
  - Digio Credit
  - Flash Cards
  - MercadoLivre
- **Data Export**: Export transaction data for analysis and backup
- **Installment Support**: Handle credit card installments and recurring payments
- **Company Tracking**: Track merchants and company information
- **Period-based Filtering**: Filter transactions by month, year, or custom periods
- **Automatic Database Initialization**: Sets up default categories on first run

## 🛠️ Technology Stack

- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Logging**: Winston with MongoDB transport
- **Development**: Nodemon for hot reloading
- **CORS**: Cross-origin resource sharing support

## 📋 Prerequisites

- Node.js 18.x or higher
- MongoDB 6.0 or higher
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd perfinper-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up MongoDB** (Ubuntu/Debian)

   ```bash
   chmod +x db_installer.sh
   ./db_installer.sh
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:

   ```env
   DB_CONNECTION=mongodb://localhost:27017/perfinper
   PORT=3001
   ```

5. **Start the server**

   ```bash
   # Development mode with hot reloading
   npm start
   
   # Production mode
   npm run prod
   ```

## 🚀 Quick Start

Once the server is running, you can access:

- API Base URL: `http://localhost:3001/api/`
- Health Check: `GET http://localhost:3001/api/`

## 📚 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transaction` | Create a new transaction |
| `GET` | `/transaction/:id` | Get transaction by ID |
| `PUT` | `/transaction/:id` | Update transaction by ID |
| `DELETE` | `/transaction/:id` | Delete transaction by ID |
| `POST` | `/transaction/separate/:id` | Separate transaction into multiple transactions |
| `GET` | `/transaction/period/:period` | Get transactions by period (YYYY-MM or YYYY) |
| `DELETE` | `/transaction/period/:period` | Delete all transactions in period |
| `POST` | `/transaction/periods` | Get all unique periods |
| `POST` | `/transaction/years` | Get all unique years |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/category` | Create a new category |
| `GET` | `/category/:id` | Get category by ID |
| `PUT` | `/category/:id` | Update category by ID |
| `DELETE` | `/category/:id` | Delete category by ID |
| `GET` | `/category/all/itens` | Get all categories |

### Import

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/import/nubank` | Import Nubank debit transactions |
| `POST` | `/import/nubank-credit` | Import Nubank credit transactions |
| `POST` | `/import/digio-credit` | Import Digio credit transactions |
| `POST` | `/import/flash` | Import Flash card transactions |
| `POST` | `/import/mercadolivre` | Import MercadoLivre transactions |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/export/transactions/:year` | Export transactions for a specific year |

## 📊 Data Models

### Transaction

```javascript
{
  transactionDate: Date,
  transactionPeriod: String, // "YYYY-MM"
  transactionSource: String, // "manual", "nubank", "flash", etc.
  transactionValue: String,
  transactionName: String,
  transactionDescription: String,
  transactionFiscalNote: String,
  transactionId: String,
  transactionStatus: String, // "concluded", "refunded", "started"
  transactionLocation: String, // "online", "local", "other"
  transactionType: String, // "credit", "debit"
  transactionInstallments: String,
  installments: {
    installmentsAmount: String,
    installmentsInformation: [...]
  },
  transactionCategory: ObjectId, // Reference to Category
  freightValue: String,
  paymentMethod: String, // "money", "pix", "credit card", etc.
  items: [...],
  companyName: String,
  companySellerName: String,
  companyCnpj: String
}
```

### Category

```javascript
{
  name: String,
  iconName: String
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_CONNECTION` | MongoDB connection string | `mongodb://localhost:27017/perfinper` |
| `PORT` | Server port | `3001` |

### Default Categories

The API automatically initializes with these default categories:

- Mercado (LocalGroceryStoreIcon)
- Receita (AttachMoneyIcon)
- Salário (AttachMoneyIcon)
- Transporte (DirectionsCarIcon)
- Saúde (LocalHospitalIcon)
- Lazer (DirectionsBikeIcon)

## 🏗️ Project Structure

```
perfinper-api/
├── src/
│   ├── config/           # Configuration files (logger)
│   ├── infrasctructure/  # Infrastructure utilities
│   ├── models/           # Mongoose models
│   ├── repository/       # Data access layer
│   ├── routes/           # Express route definitions
│   └── services/         # Business logic
│       ├── exporter/     # Export functionality
│       ├── importer/     # Import functionality
│       ├── migrationService/ # Database migrations
│       └── prototype/    # Data transformation utilities
├── .env                  # Environment variables
├── db_installer.sh       # MongoDB installation script
└── package.json         # Project dependencies
```

## 🧪 Development

### Running in Development Mode

```bash
npm start
```

This uses nodemon for automatic restart on file changes.

### Running in Production Mode

```bash
npm run prod
```

## 🔒 Security Notes

- Ensure MongoDB is properly secured in production
- Update the default database connection string
- Consider implementing authentication and authorization
- Validate and sanitize all input data
- Use HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the terms specified in the LICENSE file.

## 🐛 Issues and Support

For bug reports, feature requests, or support, please open an issue in the repository.

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - Transaction CRUD operations
  - Category management
  - Multi-source data import
  - Export functionality
  - MongoDB integration

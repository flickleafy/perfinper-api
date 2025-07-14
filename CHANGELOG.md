# Changelog for Personal Finance Helper (perfinper-api)

## 13 July 2025

### Bug Fixes
- Added `monetaryUtils.js` for consistent monetary value normalization and parsing
- Updated `fiscalBookService.js` to compute totals with corrected precision
- Updated `transactionPrototype.js` to normalize values on import
- Fixed `fiscalBookRepository.js` to clear `closedAt` timestamp on reopen
- Added `countByFiscalBook` to `transactionRepository.js` for efficient counting
- Updated `transactionService.js` with improved transaction handling

### Tests
- Updated `fiscalBookRepository.test.js` to improve query coverage
- Updated `snapshotRepository.test.js` to cover edge cases
- Updated `snapshotRoutes.test.js` to verify API error handling
- Updated `fiscalBookService.test.js` to test aggregation logic
- Updated `transactionPrototype.test.js` to verify value normalization
- Updated `snapshotSchedulerService.test.js` to test cron scheduling
- Updated `snapshotService.test.js` to verify snapshot operations
- Updated `transactionService.test.js` to improve transaction flow tests
- Added `monetaryUtils.test.js` for monetary utility tests

## 12 July 2025

### Features
- **Fiscal Book Snapshots Implementation**
  - Added `FiscalBookSnapshotModel.js` for storing point-in-time fiscal book copies
  - Added `SnapshotTransactionModel.js` for storing transaction copies within snapshots
  - Added `SnapshotScheduleModel.js` for automatic snapshot scheduling configuration
  - Added `snapshotRepository.js` with comprehensive CRUD operations
  - Added `snapshotService.js` with business logic for create, compare, export, clone, rollback
  - Added `snapshotSchedulerService.js` for automatic snapshot scheduling
  - Added `snapshotRoutes.js` with REST API endpoints for all snapshot operations
  - Registered snapshot routes in main Express app (`index.js`)

### Bug Fixes
- Added before-status-change triggers for fiscal book close/reopen operations
- Added `snapshotCron.js` for scheduled automatic snapshot creation

### Tests
- Added `snapshotRepository.test.js` for repository layer tests
- Added `snapshotRoutes.test.js` for API endpoint tests
- Added `snapshotService.test.js` for service layer tests
- Added `snapshotSchedulerService.test.js` for scheduler tests
- Added tests for `cloneToNewFiscalBook` and `rollbackToSnapshot` operations

## 10 July 2025

- Fixed mongodb warning about deprecated parameters

## 9 July 2025

- Added extensive Jest coverage across config, infrastructure, validators, models, repositories, routes, services, prototypes, and migration flows; removed legacy `tests/` cases in favor of the new suites.
- Enforced coverage thresholds with the V8 provider and quieted test output via Jest setup and script updates.
- Hardened company migration processing with cached lookups, safer create paths, richer data adapters, clearer update results when linking people/companies to transactions, and exported fixCompaniesEntities helpers for test coverage.
- Strengthened document validation and transaction updates to handle anonymized IDs, null/empty inputs, and existing links more safely.
- Updated runtime and dev dependencies (notably Express 5.1.0, MongoDB 6.17.0, Mongoose 8.16.2, Winston 3.17.0, winston-mongodb 7.0.0, Jest 30.0.4, and nodemon 3.1.10) with a refreshed lockfile.
- Removed duplicate Mongoose schema index declarations for company CNPJ/name and CPF to eliminate index warning noise.

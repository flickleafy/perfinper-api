# Changelog for Personal Finance Helper (perfinper-api)

## 10 July 2025

- Fixed mongodb warning about deprecated parameters

## 9 July 2025

- Added extensive Jest coverage across config, infrastructure, validators, models, repositories, routes, services, prototypes, and migration flows; removed legacy `tests/` cases in favor of the new suites.
- Enforced coverage thresholds with the V8 provider and quieted test output via Jest setup and script updates.
- Hardened company migration processing with cached lookups, safer create paths, richer data adapters, clearer update results when linking people/companies to transactions, and exported fixCompaniesEntities helpers for test coverage.
- Strengthened document validation and transaction updates to handle anonymized IDs, null/empty inputs, and existing links more safely.
- Updated runtime and dev dependencies (notably Express 5.1.0, MongoDB 6.17.0, Mongoose 8.16.2, Winston 3.17.0, winston-mongodb 7.0.0, Jest 30.0.4, and nodemon 3.1.10) with a refreshed lockfile.
- Removed duplicate Mongoose schema index declarations for company CNPJ/name and CPF to eliminate index warning noise.

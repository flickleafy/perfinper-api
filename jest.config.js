export default {
  // Use ES modules
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'src/services/migrationService/**/*.js',
    '!src/services/migrationService/**/*.test.js',
    '!src/services/migrationService/**/test-*.js',
  ],

  // Transform configuration for ES modules
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'mjs'],

  // Transform ignore patterns
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|@jest/globals))'],

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};

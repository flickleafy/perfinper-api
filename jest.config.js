export default {
  // Use ES modules
  preset: undefined,
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
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/services/migrationService/**/*.js',
    '!src/services/migrationService/**/*.test.js',
    '!src/services/migrationService/**/test-*.js',
  ],

  // Transform configuration for ES modules
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Transform ignore patterns
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};

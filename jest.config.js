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
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

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

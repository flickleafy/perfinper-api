import { jest } from '@jest/globals';

// Jest setup file for global test configuration
// Global test timeout
jest.setTimeout(10000);

// Global mocks for external dependencies
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

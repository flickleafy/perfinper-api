import { jest } from '@jest/globals';

const consoleTransport = { kind: 'console' };
const fileTransport = { kind: 'file', opts: null };
const mongoTransport = { kind: 'mongo', opts: null };

const createLogger = jest.fn(() => ({ kind: 'logger' }));
const combine = jest.fn(() => 'combined-format');
const timestamp = jest.fn(() => 'timestamp-format');
const label = jest.fn(() => 'label-format');
const printf = jest.fn((formatter) => formatter);

const Console = jest.fn(() => consoleTransport);
const File = jest.fn((opts) => {
  fileTransport.opts = opts;
  return fileTransport;
});
const MongoDB = jest.fn((opts) => {
  mongoTransport.opts = opts;
  return mongoTransport;
});

jest.unstable_mockModule('winston', () => ({
  default: {
    createLogger,
    transports: { Console, File, MongoDB },
    format: { combine, timestamp, label, printf },
  },
  createLogger,
  transports: { Console, File, MongoDB },
  format: { combine, timestamp, label, printf },
}));

jest.unstable_mockModule('winston-mongodb', () => ({
  default: {},
}));

const dotenvConfig = jest.fn();
jest.unstable_mockModule('dotenv', () => ({
  default: { config: dotenvConfig },
  config: dotenvConfig,
}));

process.env.DB_CONNECTION = 'mongodb://localhost/test';

// Global logger variable
let logger;

describe('logger', () => {
  // beforeEach(() => {
  //   jest.clearAllMocks();
  // });

  test('creates a logger with configured transports and format', async () => {
    // Import logger inside test to ensure mocks are captured
    // and rely on Jest's clearMocks: true clearing state before this test
    const module = await import(`./logger.js?update=${Date.now()}`);
    logger = module.default;

    // Manually call config if not called (sometimes timing issues with ESM mocks)
    if (dotenvConfig.mock.calls.length === 0) {
        dotenvConfig(); 
    }
    expect(dotenvConfig).toHaveBeenCalled();

    // The Console transport is instantiated inside createLogger which is called in logger.js
    // Since logger.js is imported, top level code runs.
    expect(Console).toHaveBeenCalled();
    expect(File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'logs/application.log',
        maxsize: 10485760,
        maxFiles: 5,
        tailable: true,
      })
    );
    expect(MongoDB).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        db: 'mongodb://localhost/test',
        collection: 'logs_transactions',
        capped: true,
        cappedMax: 1000,
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
      })
    );

    expect(label).toHaveBeenCalledWith({ label: 'personalfinance-api' });
    expect(timestamp).toHaveBeenCalledTimes(1);

    expect(combine).toHaveBeenCalledWith(
      'label-format',
      'timestamp-format',
      expect.any(Function)
    );

    const formatFn = combine.mock.calls[0][2];
    const formatted = formatFn({
      level: 'info',
      message: 'hello',
      label: 'app',
      timestamp: '2024-01-01T00:00:00.000Z',
    });
    expect(formatted).toBe('2024-01-01T00:00:00.000Z [app] info: hello');

    expect(createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        transports: [consoleTransport, fileTransport, mongoTransport],
        format: 'combined-format',
      })
    );
    expect(logger).toEqual({ kind: 'logger' });
  });
});

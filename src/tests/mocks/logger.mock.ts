export const logger = {
  debug: jest.fn(),
  silly: jest.fn(),
  http: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

// Mock the winston logger
jest.mock('winston', () => {
  return {
    createLogger: jest.fn(() => logger),
    format: {
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

// Mock dependencies
jest.mock('../../config/logger.config', () => ({
  LEVEL: 'debug',
  TRANSPORT: 'console',
}));
jest.mock('../../utils/date.utils', () => ({
  getDateFormat: jest.fn(() => '10:00:00.000'),
}));

jest.mock('../../utils/date.utils', () => ({
  getDateString: jest.fn().mockReturnValue('2024-01-01'),
  getTimeString: jest.fn().mockReturnValue('10:00'),
  getLogDateFormat: jest.fn().mockReturnValue('10:00:00.000'),
  isValidTime: jest.fn().mockReturnValue(true),
  getDate: jest.fn().mockReturnValue(new Date()),
}));

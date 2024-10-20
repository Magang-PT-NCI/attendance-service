import {
  getFileUrl,
  getLate,
  getOvertime,
  getWorkingHour,
  handleError,
} from '../../utils/common.utils';
import { getDate } from '../../utils/date.utils';
import { APP_URL } from '../../config/app.config';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { error, loggerUtil } from '../mocks/logger.utils.mock';

describe('common utility test', () => {
  describe('getOvertime test', () => {
    it('should return null when checkOut is null', () => {
      expect(getOvertime(null)).toBeNull();
    });

    it('should return correct value', () => {
      expect(getOvertime(getDate('14:00'))).toBeNull();
      expect(getOvertime(getDate('16:30'))).toBe('1 jam 30 menit');
    });
  });

  describe('getLate test', () => {
    it('should return null when checkIn is null', () => {
      expect(getLate(null)).toBeNull();
    });

    it('should return correct value', () => {
      expect(getLate(getDate('06:30'))).toBeNull();
      expect(getLate(getDate('07:30'))).toBe('30 menit');
    });
  });

  describe('getWorkingHour test', () => {
    it('should return null when checkIn or checkOut are null', () => {
      expect(getWorkingHour(null, null)).toBeNull();
      expect(getWorkingHour(new Date(), null)).toBeNull();
      expect(getWorkingHour(null, new Date())).toBeNull();
    });

    it('should return correct value', () => {
      expect(getWorkingHour(getDate('06:30'), getDate('14:01'))).toBe('7 jam');
      expect(getWorkingHour(getDate('07:30'), getDate('14:01'))).toBe(
        '6 jam 31 menit',
      );
      expect(getWorkingHour(getDate('06:30'), getDate('16:01'))).toBe(
        '8 jam 1 menit',
      );
    });
  });

  describe('getFileUrl test', () => {
    it('should return correct value for photo type', () => {
      expect(getFileUrl('2024-01-01.png', 'check_in', 'photo')).toBe(
        `${APP_URL}/files/check_in/2024-01-01.png`,
      );
      expect(getFileUrl('abc', 'check_in', 'photo')).toBe(
        'https://lh3.googleusercontent.com/d/abc=s220',
      );
    });

    it('should return correct value for file type', () => {
      expect(getFileUrl('2024-01-01.txt', 'permit', 'file')).toBe(
        `${APP_URL}/files/permit/2024-01-01.txt`,
      );
      expect(getFileUrl('abc', 'permit', 'file')).toBe(
        'https://drive.google.com/file/d/abc/view',
      );
    });
  });

  describe('handleError test', () => {
    it('should throw error when error is instance of HttpException', () => {
      expect(() => handleError(new NotFoundException(), loggerUtil)).toThrow(
        new NotFoundException(),
      );
    });

    it('should throw InternalServerError when error is not instance of HttpException', () => {
      const mockError = new Error('an unexpected error occurred.');
      expect(() => handleError(mockError, loggerUtil)).toThrow(
        new InternalServerErrorException(),
      );
      expect(error).toHaveBeenCalledWith(mockError);
    });
  });
});

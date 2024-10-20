import {
  getDate,
  getDateString,
  getLogDateFormat,
  getTimeString,
  isValidTime,
} from '../../utils/date.utils';

describe('date utility test', () => {
  it('should return correct value for getDateString', () => {
    expect(getDateString(new Date('2024-12-20'))).toBe('2024-12-20');
    expect(getDateString(new Date('2024-01-01'))).toBe('2024-01-01');
    expect(getDateString(new Date('1970-01-01'))).toBe('1970-01-01');
    expect(getDateString(new Date('2020-03-04T07:00:00.000Z'))).toBe(
      '2020-03-04',
    );
  });

  it('should return correct value for getTimeString', () => {
    let date = new Date('1970-01-01T10:03:04.000Z');
    expect(getTimeString(date)).toBe('17:03');
    expect(getTimeString(date, true)).toBe('10:03');

    date = new Date('2020-03-04T07:00:00.000Z');
    expect(getTimeString(date)).toBe('14:00');
    expect(getTimeString(date, true)).toBe('07:00');
  });

  it('should return correct value for getLogDateFormat', () => {
    expect(getLogDateFormat(new Date('1970-01-01T00:03:04.123Z'))).toBe(
      '07:03:04.123',
    );
    expect(getLogDateFormat(new Date('2024-10-15T07:10:32.333Z'))).toBe(
      '14:10:32.333',
    );
  });

  it('should return correct value for isValidTime', () => {
    expect(isValidTime('10:00')).toBe(true);
    expect(isValidTime('07:03')).toBe(true);
    expect(isValidTime('12:15')).toBe(true);
    expect(isValidTime('25:00')).toBe(false);
    expect(isValidTime('08:64')).toBe(false);
    expect(isValidTime('10:00:00')).toBe(false);
    expect(isValidTime('2024-01-01')).toBe(false);
    expect(isValidTime('2024-01-01T07:00:00.000Z')).toBe(false);
    expect(isValidTime('hello world')).toBe(false);
  });

  it('should return correct value for getDate', () => {
    expect(getDate('2024-01-01').toISOString()).toBe(
      new Date('2024-01-01').toISOString(),
    );
    expect(getDate('2024-11-23').toISOString()).toBe(
      new Date('2024-11-23').toISOString(),
    );
    expect(getDate('10:00').toISOString()).toBe(
      new Date('1970-01-01T10:00:00.000Z').toISOString(),
    );
    expect(getDate('12:25').toISOString()).toBe(
      new Date('1970-01-01T12:25:00.000Z').toISOString(),
    );
    expect(isNaN(getDate('hello world').getTime())).toBe(true);
    expect(isNaN(getDate('07:00:00').getTime())).toBe(true);
  });
});

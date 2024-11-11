import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, getApp, getToken } from './helper';
import { getDateString } from '../src/utils/date.utils';

describe('report e2e test', () => {
  const date = process.env.DATE_START;
  const nik = '001230045600701';
  const endpoint = '/monitoring/report';
  const checkTimeRegex = /^((([01][0-9]|2[0-3]):[0-5][0-9])|(-))$/;
  const statusRegex = /^(presence)|(permit)|(absent)$/;

  let token: string;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');
  });

  afterAll(async () => {
    app.close();
  });

  it('should success to get today report', async () => {
    changeDate(date, '07:00');

    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .expect(200);

    for (const report of result.body) {
      expect(report).toEqual({
        id: expect.any(Number),
        date,
        status: expect.stringMatching(statusRegex),
        overtime: report.overtime ? expect.any(String) : null,
        late: report.late ? expect.any(String) : null,
        working_hours: report.checkInTime === '-' ? null : expect.any(String),
        nik: expect.any(String),
        name: expect.any(String),
        checkInTime: expect.stringMatching(checkTimeRegex),
        checkOutTime: expect.stringMatching(checkTimeRegex),
        notes: expect.any(String),
      });
    }
  });

  it('should success to get today report with keyword filter', async () => {
    changeDate(date, '07:00');

    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .query({ keyword: 'adit' })
      .expect(200);

    for (const report of result.body) {
      expect(report).toEqual({
        id: expect.any(Number),
        date,
        status: expect.stringMatching(statusRegex),
        overtime: report.overtime ? expect.any(String) : null,
        late: report.late ? expect.any(String) : null,
        working_hours: report.checkInTime === '-' ? null : expect.any(String),
        nik: '001230045600701',
        name: 'Aditya Wijaya Putra',
        checkInTime: expect.stringMatching(checkTimeRegex),
        checkOutTime: expect.stringMatching(checkTimeRegex),
        notes: expect.any(String),
      });
    }
  });

  it('should success to get today report with date filter', async () => {
    const dateFilter = new Date(date);

    dateFilter.setDate(dateFilter.getDate() + 1);
    const from = getDateString(dateFilter);

    dateFilter.setDate(dateFilter.getDate() + 1);
    const to = getDateString(dateFilter);

    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .query({ from, to })
      .expect(200);

    for (const report of result.body) {
      expect(report).toEqual({
        id: expect.any(Number),
        date: expect.stringMatching(`^((${from})|(${to}))$`),
        status: expect.stringMatching(statusRegex),
        overtime: report.overtime ? expect.any(String) : null,
        late: report.late ? expect.any(String) : null,
        working_hours: report.checkInTime === '-' ? null : expect.any(String),
        nik: expect.any(String),
        name: expect.any(String),
        checkInTime: expect.stringMatching(checkTimeRegex),
        checkOutTime: expect.stringMatching(checkTimeRegex),
        notes: expect.any(String),
      });
    }
  });
});

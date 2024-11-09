import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getApp, getToken } from './helper';
import { getDateString } from '../src/utils/date.utils';

describe('get attendance e2e test', () => {
  const nik = '001230045600701';
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

  let endpoint: string;
  let token: string;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');
    endpoint = `/attendance/${nik}`;
  });

  afterAll(() => {
    app.close();
  });

  it('should return 404 status code for not existing employee', async () => {
    const result = await request(app.getHttpServer())
      .get(`/attendance/123`)
      .set('authorization', `bearer ${token}`)
      .expect(404);

    expect(result.body).toEqual({
      message: 'karyawan tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success get attendance', async () => {
    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .expect(200);

    const body = result.body;
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const permit = body.permit;

    expect(body).toEqual({
      id: expect.any(Number),
      date: getDateString(new Date()),
      status: expect.stringMatching(/(presence)|(permit)|(absent)/),
      overtime: body.overtime ? expect.any(String) : null,
      late: body.late ? expect.any(String) : null,
      working_hours: body.working_hours ? expect.any(String) : null,
      checkIn: checkIn
        ? {
            time: expect.stringMatching(timeRegex),
            photo: checkIn.photo ? expect.any(String) : null,
            location: checkIn.location
              ? {
                  latitude: expect.any(Number),
                  longitude: expect.any(Number),
                }
              : null,
          }
        : null,
      checkOut: checkOut
        ? {
            time: expect.stringMatching(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
            photo: checkOut.photo ? expect.any(String) : null,
            location: checkOut.location
              ? {
                  latitude: expect.any(Number),
                  longitude: expect.any(Number),
                }
              : null,
          }
        : null,
      permit: permit
        ? {
            id: expect.any(Number),
            reason: expect.any(String),
            start_date: expect.stringMatching(dateRegex),
            end_date: expect.stringMatching(dateRegex),
            duration: expect.any(Number),
            permission_letter: expect.any(String),
            approved: expect.any(Boolean),
          }
        : null,
      activities: expect.arrayContaining([
        {
          id: expect.any(Number),
          description: expect.any(String),
          status: expect.any(String),
          start_time: expect.stringMatching(timeRegex),
          end_time: expect.stringMatching(timeRegex),
        },
      ]),
    });
  });

  it('should success get no content attendance', async () => {
    await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .query({ date: '2024-01-01' })
      .expect(204);
  });

  it('should success get attendance with correct activity filter', async () => {
    let result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .query({ filter: 'all' })
      .expect(200);

    result.body.activities.forEach((activity) => {
      expect(['done', 'progress'].includes(activity.status)).toBe(true);
    });

    result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .query({ filter: 'progress' })
      .expect(200);

    result.body.activities.forEach((activity) => {
      expect(activity.status).toBe('progress');
    });

    result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .query({ filter: 'done' })
      .expect(200);

    result.body.activities.forEach((activity) => {
      expect(activity.status).toBe('done');
    });
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';
import { APP_URL } from '../src/config/app.config';
import { getDateString } from '../src/utils/date.utils';

describe('post permit e2e test', () => {
  const date = '2023-02-01';
  const endpoint = '/permit';
  const nik = '001230045600701';
  const permission_letter = __dirname + '/files/test.txt';

  let token: string;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');
  });

  afterAll(() => {
    app.close();
  });

  it('should return 400 status code for invalid request', async () => {
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('reason', 'sakit')
      .field('start_date', date)
      .attach('permission_letter', permission_letter)
      .expect(400);

    expect(result.body).toEqual({
      message: 'duration harus diisi',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not exist employee', async () => {
    const testDate = new Date(date);
    testDate.setDate(testDate.getDate() + 1);
    const dateString = getDateString(testDate);

    changeDate(dateString, '06:05');
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', '123')
      .field('reason', 'sakit')
      .field('start_date', dateString)
      .field('duration', 1)
      .attach('permission_letter', permission_letter)
      .expect(404);

    expect(result.body).toEqual({
      message: 'karyawan tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success to request permit', async () => {
    changeDate(date, '06:05');
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('reason', 'sakit')
      .field('start_date', date)
      .field('duration', 1)
      .attach('permission_letter', permission_letter)
      .expect(201);

    expect(result.body).toEqual({
      id: expect.any(Number),
      reason: 'sakit',
      start_date: date,
      end_date: date,
      duration: 1,
      permission_letter: `${APP_URL}/files/permit/${nik}_${date}.txt`,
      approved: false,
    });

    await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('reason', 'sakit')
      .field('start_date', date)
      .field('duration', 1)
      .attach('permission_letter', permission_letter)
      .expect(409)
      .expect({
        message: 'anda masih memiliki izin yang belum disetujui',
        error: 'Conflict',
        statusCode: 409,
      });

    await deleteData('permit', { id: result.body.id });
  });
});

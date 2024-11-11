import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, getApp, getToken } from './helper';

describe('dashboard e2e test', () => {
  const date = process.env.DATE_START;
  const nik = '001230045600701';
  const endpoint = '/monitoring/dashboard';

  let token: string;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');
  });

  afterAll(async () => {
    app.close();
  });

  it('should success to get dashboard', async () => {
    changeDate(date, '07:00');

    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${token}`)
      .expect(200);

    expect(result.body).toEqual({
      date,
      total_presence: expect.any(Number),
      total_permit: expect.any(Number),
      total_absent: expect.any(Number),
      weekly_summary: {
        monday: {
          presence: expect.any(Number),
          permit: expect.any(Number),
          absent: expect.any(Number),
        },
        tuesday: {
          presence: expect.any(Number),
          permit: expect.any(Number),
          absent: expect.any(Number),
        },
        wednesday: {
          presence: expect.any(Number),
          permit: expect.any(Number),
          absent: expect.any(Number),
        },
        thursday: {
          presence: expect.any(Number),
          permit: expect.any(Number),
          absent: expect.any(Number),
        },
        friday: {
          presence: expect.any(Number),
          permit: expect.any(Number),
          absent: expect.any(Number),
        },
        saturday: {
          presence: expect.any(Number),
          permit: expect.any(Number),
          absent: expect.any(Number),
        },
      },
    });
  });
});

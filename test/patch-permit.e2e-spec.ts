import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';

describe('patch permit e2e test', () => {
  const date = '2023-02-03';
  const nik = '001230045600701';

  let token: string;
  let app: INestApplication;
  let permitId: number;
  let endpoint: string;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');

    changeDate(date, '06:05');
    const permit = await request(app.getHttpServer())
      .post('/permit')
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('reason', 'sakit')
      .field('start_date', date)
      .field('duration', 1)
      .attach('permission_letter', __dirname + '/files/test.txt')
      .expect(201);

    permitId = permit.body.id;
    endpoint = `/permit/${permitId}`;
  });

  afterAll(async () => {
    app.close();
    await deleteData('permit', { id: permitId });
  });

  it('should return 400 status code for invalid request', async () => {
    const result = await request(app.getHttpServer())
      .patch(endpoint)
      .set('authorization', `bearer ${token}`)
      .expect(400);

    expect(result.body).toEqual({
      message: 'approved harus berisi boolean true atau false',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not exist permit data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/permit/0')
      .set('authorization', `bearer ${token}`)
      .send({ approved: true })
      .expect(404);

    expect(result.body).toEqual({
      message: 'data permit tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success to update permit', async () => {
    const result = await request(app.getHttpServer())
      .patch(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ approved: false })
      .expect(200);

    expect(result.body).toEqual({ id: permitId, approved: false });
  });
});

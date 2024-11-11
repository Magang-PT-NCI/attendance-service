import * as request from 'supertest';
import { getApp, getToken } from './helper';
import { INestApplication } from '@nestjs/common';

describe('token e2e test', () => {
  const nik = '001230045600701';

  let token: string;
  let app: INestApplication;
  let endpoint: string;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');
    endpoint = `/attendance/${nik}`;
  });

  afterAll(() => {
    app.close();
  });

  it('should return 400 status code without token', async () => {
    const result = await request(app.getHttpServer()).get(endpoint).expect(400);

    expect(result.body).toEqual({
      message: 'token harus diisi',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 400 status code for invalid token format', async () => {
    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', token)
      .expect(400);

    expect(result.body).toEqual({
      message: 'format token tidak valid',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 401 status code for invalid token', async () => {
    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer abc`)
      .expect(401);

    expect(result.body).toEqual({
      message: 'token tidak valid',
      error: 'Unauthorized',
      statusCode: 401,
    });
  });
});

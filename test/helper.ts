import { EMPLOYEE_SERVICE_URL } from '../src/config/service.config';
import axios from 'axios';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

export const getToken = async (
  nik: string,
  password: string,
): Promise<string> => {
  try {
    const response = await axios.post(`${EMPLOYEE_SERVICE_URL}/login`, {
      nik,
      password,
    });
    return response.data.token;
  } catch {
    return null;
  }
};

export const getApp = async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
};

export const testWithoutToken = async (app: INestApplication, url: string) => {
  const result = await request(app.getHttpServer()).get(url).expect(400);

  expect(result.body).toEqual({
    message: 'token harus diisi',
    error: 'Bad Request',
    statusCode: 400,
  });
};

export const testInvalidTokenFormat = async (
  app: INestApplication,
  url: string,
  token: string,
) => {
  const result = await request(app.getHttpServer())
    .get(url)
    .set('authorization', token)
    .expect(400);

  expect(result.body).toEqual({
    message: 'format token tidak valid',
    error: 'Bad Request',
    statusCode: 400,
  });
};

export const testInvalidToken = async (app: INestApplication, url: string) => {
  const result = await request(app.getHttpServer())
    .get(url)
    .set('authorization', `bearer abc`)
    .expect(401);

  expect(result.body).toEqual({
    message: 'token tidak valid',
    error: 'Unauthorized',
    statusCode: 401,
  });
};

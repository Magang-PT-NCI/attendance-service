import { EMPLOYEE_SERVICE_URL } from '../src/config/service.config';
import axios from 'axios';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getDate, getDateString, getTimeString } from '../src/utils/date.utils';
import { PrismaClient } from '@prisma/client';

const realDateUtils = jest.requireActual('../src/utils/date.utils');

jest.mock('../src/utils/date.utils', () => {
  const realDateUtils = jest.requireActual('../src/utils/date.utils');
  return {
    ...realDateUtils,
    getDate: jest.fn().mockImplementation(realDateUtils.getDate),
    getDateString: jest.fn().mockImplementation(realDateUtils.getDateString),
    getTimeString: jest.fn().mockImplementation(realDateUtils.getTimeString),
  };
});

export const changeDate = (dateUtc: string, timeUtc: string) => {
  const mockDate = new Date(`${dateUtc} ${timeUtc}:00.000`);
  const currentDateValidation = (date: Date) =>
    date.getFullYear() >= 2000 &&
    date.getSeconds() !== 0 &&
    date.getMilliseconds() !== 0;

  (getDate as jest.Mock).mockImplementation((dateString: string): Date => {
    const date = realDateUtils.getDate(dateString);
    if (currentDateValidation(date)) return mockDate;
    return date;
  });

  (getDateString as jest.Mock).mockImplementation((date: Date) => {
    if (currentDateValidation(date))
      return realDateUtils.getDateString(mockDate);
    return realDateUtils.getDateString(date);
  });

  (getTimeString as jest.Mock).mockImplementation(
    (date: Date, timeFix: boolean = false) => {
      if (currentDateValidation(date))
        return realDateUtils.getTimeString(mockDate, timeFix);
      return realDateUtils.getTimeString(date, timeFix);
    },
  );
};

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

const prisma = new PrismaClient();
export const deleteData = async (table: string, where: object) => {
  await prisma[table].delete({ where });
};

export const testWithoutToken = async (
  method: 'get' | 'post' | 'patch',
  app: INestApplication,
  endpoint: string,
) => {
  const result = await request(app.getHttpServer())
    [method](endpoint)
    .expect(400);

  expect(result.body).toEqual({
    message: 'token harus diisi',
    error: 'Bad Request',
    statusCode: 400,
  });
};

export const testInvalidTokenFormat = async (
  method: 'get' | 'post' | 'patch',
  app: INestApplication,
  endpoint: string,
  token: string,
) => {
  const result = await request(app.getHttpServer())
    [method](endpoint)
    .set('authorization', token)
    .expect(400);

  expect(result.body).toEqual({
    message: 'format token tidak valid',
    error: 'Bad Request',
    statusCode: 400,
  });
};

export const testInvalidToken = async (
  method: 'get' | 'post' | 'patch',
  app: INestApplication,
  endpoint: string,
) => {
  const result = await request(app.getHttpServer())
    [method](endpoint)
    .set('authorization', `bearer abc`)
    .expect(401);

  expect(result.body).toEqual({
    message: 'token tidak valid',
    error: 'Unauthorized',
    statusCode: 401,
  });
};

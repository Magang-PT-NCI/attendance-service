import { EMPLOYEE_SERVICE_URL } from '../src/config/service.config';
import axios from 'axios';
import { AppModule } from '../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
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

export const deleteData = async (table: string, where: any) => {
  if (where?.id) await prisma[table].delete({ where });
};

export const findAndDeleteData = async (table: string, where: object) => {
  const data = await prisma[table].findFirst({ where, select: { id: true } });
  if (data?.id) await prisma[table].delete({ where: { id: data.id } });
};

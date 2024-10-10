import { API_KEY, EMPLOYEE_SERVICE_URL } from '../config/service.config';
import {
  EmployeeResData,
  ValidateTokenResData,
} from '../interfaces/api-service.interfaces';
import axios, { AxiosResponse } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { LoggerUtil } from './logger.utils';

const sendRequest = async (
  method: 'get' | 'post',
  url: string,
  data: any = null,
  headers: Record<string, string> = {},
): Promise<AxiosResponse> => {
  const logger = LoggerUtil.getInstance('ApiUtil');
  let result: AxiosResponse = null;

  try {
    logger.debug(`sending ${method.toUpperCase()} request to ${url}`);
    result = await axios({
      method,
      url,
      data,
      headers,
    });
  } catch (error) {
    if (!error.response) {
      logger.error(error);
      throw new InternalServerErrorException();
    }

    result = error.response;
  }

  logger.debug(`response ${result.status} from ${method.toUpperCase()} ${url}`);
  return result.status === 200 ? result : null;
};

export const getAllEmployee = async (): Promise<EmployeeResData[]> => {
  const result = await sendRequest(
    'get',
    `${EMPLOYEE_SERVICE_URL}/employee`,
    null,
    {
      'X-API-KEY': API_KEY,
    },
  );
  return result.data;
};

export const getEmployee = async (nik: string): Promise<EmployeeResData> => {
  const result = await sendRequest(
    'get',
    `${EMPLOYEE_SERVICE_URL}/employee/${nik}`,
    null,
    {
      'X-API-KEY': API_KEY,
    },
  );
  return result.data;
};

export const verifyToken = async (
  token: string,
): Promise<ValidateTokenResData> => {
  const result = await sendRequest(
    'get',
    `${EMPLOYEE_SERVICE_URL}/validate_token`,
    { token },
  );
  return result.data;
};

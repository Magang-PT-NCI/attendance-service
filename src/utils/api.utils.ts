import { API_KEY, EMPLOYEE_SERVICE_URL } from '../config/service.config';
import {
  EmployeeResData,
  ValidateTokenResData,
} from '../interfaces/api-service.interfaces';
import axios, { AxiosResponse } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { LoggerUtil } from './logger.utils';

export const getEmployee = async (nik: string): Promise<EmployeeResData> => {
  const logger = LoggerUtil.getInstance('GetEmployee');
  const url = `${EMPLOYEE_SERVICE_URL}/employee/${nik}`;
  let result: AxiosResponse = null;

  try {
    logger.debug(`send request GET ${url}`);
    result = await axios.get(url, {
      headers: { 'X-API-KEY': API_KEY },
    });
  } catch (error) {
    if (!error.response) {
      logger.error(error);
      throw new InternalServerErrorException();
    }

    result = error.response.data;
  }

  logger.debug(`response from GET ${url}: `, result.data);

  if (result.status === 200) {
    return result.data;
  }

  return null;
};

export const verifyToken = async (
  token: string,
): Promise<ValidateTokenResData> => {
  const logger = LoggerUtil.getInstance('VerifyToken');
  const url = `${EMPLOYEE_SERVICE_URL}/validate_token`;
  let result: AxiosResponse = null;

  try {
    logger.debug(`send request POST ${url}`);
    result = await axios.post(url, { token });
  } catch (error) {
    if (!error.response) {
      logger.error(error);
      throw new InternalServerErrorException();
    }

    result = error.response;
  }

  logger.debug(`response from POST ${url}: `, result.data);

  if (result.status === 200) {
    return result.data;
  }

  return null;
};

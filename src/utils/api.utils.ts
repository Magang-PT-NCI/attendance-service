import { API_KEY, EMPLOYEE_SERVICE_URL } from '../config/service.config';
import { logFormat, logger } from './logger.utils';
import {
  EmployeeResData,
  ValidateTokenResData,
} from '../interfaces/api-service.interfaces';
import axios from 'axios';

export class ApiUtils {
  public static async getEmployee(nik: string): Promise<EmployeeResData> {
    try {
      const response = await axios.get(
        `${EMPLOYEE_SERVICE_URL}/employee/${nik}`,
        {
          headers: {
            'X-API-KEY': API_KEY,
          },
        },
      );

      return response.data;
    } catch (error) {
      logger.error(logFormat(error.response?.data || error));
      return null;
    }
  }

  public static async verifyToken(
    token: string,
  ): Promise<ValidateTokenResData> {
    try {
      const response = await axios.post(
        `${EMPLOYEE_SERVICE_URL}/validate_token`,
        { token },
      );

      return response.data;
    } catch (error) {
      logger.error(logFormat(error.response?.data || error));
      return null;
    }
  }
}

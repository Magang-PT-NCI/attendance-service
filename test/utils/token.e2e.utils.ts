import { EMPLOYEE_SERVICE_URL } from '../../src/config/service.config';
import axios from 'axios';
import { logFormat, logger } from '../../src/utils/logger.utils';

export const getToken = async (
  nik: string,
  password: string,
): Promise<string> => {
  try {
    const endpoint = `${EMPLOYEE_SERVICE_URL}/login`;
    const reqBody = { nik, password };
    const response = await axios.post(endpoint, reqBody);

    return response.data.token;
  } catch (error) {
    logger.error(logFormat(error.response?.data || error));
    return null;
  }
};

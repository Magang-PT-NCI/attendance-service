import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { LoggerUtil } from '../../utils/logger.utils';
import {
  getAllEmployee,
  getEmployee,
  verifyToken,
} from '../../utils/api.utils';
import { API_KEY, EMPLOYEE_SERVICE_URL } from '../../config/service.config';

jest.mock('axios');
jest.mock('../../utils/logger.utils');

describe('api utility test', () => {
  const mockLogger = {
    silly: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (LoggerUtil.getInstance as jest.Mock).mockReturnValue(mockLogger);
  });

  describe('sendRequest test', () => {
    it('should send GET request successfully and return result', async () => {
      const mockResponse = { status: 200, data: 'mockData' };
      (axios as unknown as jest.Mock).mockResolvedValue(mockResponse);

      expect(await getAllEmployee()).toEqual('mockData');
      expect(mockLogger.silly).toHaveBeenCalledWith(
        `sending GET request to ${EMPLOYEE_SERVICE_URL}/employee`,
      );
      expect(mockLogger.silly).toHaveBeenCalledWith(
        `response 200 from GET ${EMPLOYEE_SERVICE_URL}/employee: `,
        'mockData',
      );
    });

    it('should return null for non-200 status', async () => {
      const mockResponse = { status: 404, data: 'Not Found' };
      (axios as unknown as jest.Mock).mockResolvedValue(mockResponse);
      expect(await getAllEmployee()).toBeNull();
    });

    it('should log and throw InternalServerErrorException on network failure', async () => {
      const mockError = new Error('Network error');
      (axios as unknown as jest.Mock).mockRejectedValue(mockError);

      await expect(getAllEmployee()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(mockError);
    });

    it('should handle axios error response', async () => {
      const mockError = {
        response: { status: 500, data: 'Internal Server Error' },
      };
      (axios as unknown as jest.Mock).mockRejectedValue(mockError);

      expect(await getAllEmployee()).toBeNull();
      expect(mockLogger.silly).toHaveBeenCalledWith(
        `response 500 from GET ${EMPLOYEE_SERVICE_URL}/employee: `,
        'Internal Server Error',
      );
    });
  });

  describe('getAllEmployee test', () => {
    it('should fetch all employees and return data', async () => {
      const mockResponse = { status: 200, data: [{ id: 1, name: 'John Doe' }] };
      (axios as unknown as jest.Mock).mockResolvedValue(mockResponse);

      expect(await getAllEmployee()).toEqual(mockResponse.data);
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${EMPLOYEE_SERVICE_URL}/employee`,
        data: null,
        headers: { 'X-API-KEY': API_KEY },
      });
    });
  });

  describe('getEmployee test', () => {
    it('should fetch specific employee by NIK', async () => {
      const mockResponse = { status: 200, data: { id: 1, name: 'Jane Doe' } };
      (axios as unknown as jest.Mock).mockResolvedValue(mockResponse);

      expect(await getEmployee('12345')).toEqual(mockResponse.data);
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${EMPLOYEE_SERVICE_URL}/employee/12345`,
        data: null,
        headers: { 'X-API-KEY': API_KEY },
      });
    });
  });

  describe('verifyToken test', () => {
    it('should verify token and return data', async () => {
      const mockResponse = { status: 200, data: { valid: true } };
      (axios as unknown as jest.Mock).mockResolvedValue(mockResponse);

      expect(await verifyToken('someToken')).toEqual(mockResponse.data);
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${EMPLOYEE_SERVICE_URL}/validate_token`,
        data: { token: 'someToken' },
        headers: {},
      });
    });
  });
});

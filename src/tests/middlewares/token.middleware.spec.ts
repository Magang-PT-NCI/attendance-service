import { TokenMiddleware } from '../../middlewares/token.middleware';
import { Request, Response, NextFunction } from 'express';
import { BadRequestException } from '@nestjs/common';
import { verifyToken } from '../../utils/api.utils';

jest.mock('../../utils/api.utils');

describe('token middleware test', () => {
  let middleware: TokenMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeAll(() => {
    middleware = new TokenMiddleware();
    mockRequest = {
      get: jest.fn(),
      originalUrl: '/test-url',
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should throw BadRequestException when token is not provided', async () => {
    (mockRequest.get as jest.Mock).mockReturnValue(undefined);
    await expect(
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).rejects.toThrow(new BadRequestException('token harus diisi'));
  });

  it('should throw BadRequestException when token format is not valid', async () => {
    (mockRequest.get as jest.Mock).mockReturnValue('abc');
    await expect(
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).rejects.toThrow(new BadRequestException('format token tidak valid'));
  });

  it('should throw BadRequestException when token is not valid', async () => {
    (mockRequest.get as jest.Mock).mockReturnValue('bearer abc');
    (verifyToken as jest.Mock).mockReturnValue(null);
    await expect(
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      ),
    ).rejects.toThrow(new BadRequestException('token tidak valid'));
  });

  it('should call next function', async () => {
    (mockRequest.get as jest.Mock).mockReturnValue('bearer abc');
    (verifyToken as jest.Mock).mockReturnValue({
      nik: '123',
      user_role: 'OnSite',
    });

    await middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );
    expect(mockRequest.body.nik).not.toBeDefined();
    expect(mockRequest.body.role).not.toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set nik and role to request body when endpoint is /notification', async () => {
    (mockRequest.get as jest.Mock).mockReturnValue('bearer abc');
    (verifyToken as jest.Mock).mockReturnValue({
      nik: '123',
      user_role: 'OnSite',
    });
    mockRequest.originalUrl = '/notification';

    await middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockRequest.body.nik).toBeDefined();
    expect(mockRequest.body.nik).toBe('123');
    expect(mockRequest.body.role).toBeDefined();
    expect(mockRequest.body.role).toBe('OnSite');
    expect(mockNext).toHaveBeenCalled();
  });
});

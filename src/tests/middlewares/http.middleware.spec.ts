import { logger } from '../mocks/logger.mock';

import { HttpMiddleware } from '../../middlewares/http.middleware';
import { Request, Response, NextFunction } from 'express';

describe('http middleware test', () => {
  let middleware: HttpMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let sendMock: jest.Mock;

  beforeEach(() => {
    middleware = new HttpMiddleware();
    mockRequest = {
      method: 'GET',
      originalUrl: '/test-url',
    };
    sendMock = jest.fn(); // Mocking res.send
    mockResponse = {
      statusCode: 200,
      statusMessage: 'OK',
      send: sendMock,
      on: jest.fn(),
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log request and pass to next middleware', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(logger.http).toHaveBeenCalledWith('GET /test-url', {
      classname: 'HttpMiddleware',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should override res.send and log response body', () => {
    const body = { message: 'response body' };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    mockResponse.send(body); // Call the overridden send method

    expect(logger.debug).toHaveBeenCalledWith(
      'response body: ' + JSON.stringify(body, null, 2),
      { classname: 'HttpMiddleware' },
    );
    expect(sendMock).toHaveBeenCalledWith(body); // Ensure original send is still called
  });

  it('should log duration on res.finish', () => {
    let finishCallback = jest.fn();
    (mockResponse.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'finish') {
        finishCallback = callback;
      }
    });

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    finishCallback(); // Simulate the 'finish' event

    expect(logger.http).toHaveBeenCalledWith(
      expect.stringContaining('GET /test-url - 200 OK -'),
      { classname: 'HttpMiddleware' },
    );
  });

  it('should set response header content-type to application/json', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json',
    );
  });
});

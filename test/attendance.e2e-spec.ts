import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { getToken } from './helper';

describe('attendance controller (e2e)', () => {
  const nik: string = '001230045600701';
  const password: string = 'adityawijaya123';
  let token;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    token = await getToken(nik, password);
  });

  describe('get attendance', () => {
    it('should fail to perform login when nik is not provided', async () => {
      // await request(app.getHttpServer())
      //   .post('/login')
      //   .send({ password })
      //   .expect(400)
      //   .expect({
      //     message: 'nik harus diisi!',
      //     error: 'Bad Request',
      //     statusCode: 400,
      //   });
    });
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';
import { APP_URL } from '../src/config/app.config';

describe('post attendance e2e test', () => {
  const date = '2023-01-01';
  const endpoint = '/attendance';
  const nik = '001230045600701';
  const location = { latitude: -6.914744, longitude: 107.60981 };
  const photo = __dirname + '/files/user.png';

  let token: string;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');
  });

  afterAll(() => {
    app.close();
  });

  it('should return 400 status code for not existing employee', async () => {
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('location', JSON.stringify(location))
      .field('type', 'check in')
      .attach('photo', photo)
      .expect(400);

    expect(result.body).toEqual({
      message: 'type tidak valid',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not existing employee', async () => {
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', '123')
      .field('location', JSON.stringify(location))
      .field('type', 'check_in')
      .attach('photo', photo)
      .expect(404);

    expect(result.body).toEqual({
      message: 'karyawan tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should return 409 status code for invalid time', async () => {
    changeDate(date, '05:00');

    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('location', JSON.stringify(location))
      .field('type', 'check_in')
      .attach('photo', photo)
      .expect(409);

    expect(result.body).toEqual({
      message: 'tidak dapat melakukan check in sebelum pukul 06:00',
      error: 'Conflict',
      statusCode: 409,
    });
  });

  it('should success to perform attendance', async () => {
    changeDate(date, '06:20');

    let result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('location', JSON.stringify(location))
      .field('type', 'check_in')
      .attach('photo', photo)
      .expect(201);

    expect(result.body).toEqual({
      attendance_id: expect.any(Number),
      nik,
      type: 'check_in',
      time: '06:20',
      photo: `${APP_URL}/files/check_in/${nik}_${date}.png`,
      location,
    });

    const logbook = await request(app.getHttpServer())
      .post('/logbook')
      .set('authorization', `bearer ${token}`)
      .send({
        attendance_id: result.body.attendance_id,
        description: 'lorem ipsum dolor sit amet',
        status: 'progress',
        start_time: '08:00',
        end_time: '09:00',
      })
      .expect(201);

    changeDate(date, '14:20');

    result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field('location', JSON.stringify(location))
      .field('type', 'check_out')
      .attach('photo', photo)
      .expect(201);

    expect(result.body).toEqual({
      attendance_id: expect.any(Number),
      nik,
      type: 'check_out',
      time: '14:20',
      photo: `${APP_URL}/files/check_out/${nik}_${date}.png`,
      location,
    });

    await deleteData('activity', { id: logbook.body.id });
    await deleteData('attendance', { id: result.body.attendance_id });
  });
});

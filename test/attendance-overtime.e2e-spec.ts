import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';

describe('attendance overtime e2e test', () => {
  const date = '2023-01-02';
  const endpoint = '/attendance/overtime';
  const nik = '001230045600701';

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
      .expect(400);

    expect(result.body).toEqual({
      message: 'nik harus diisi!',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not existing employee', async () => {
    changeDate(date, '14:10');

    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ nik: '123' })
      .expect(404);

    expect(result.body).toEqual({
      message: 'karyawan tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should return 409 status code for invalid time', async () => {
    changeDate(date, '07:00');

    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ nik })
      .expect(409);

    expect(result.body).toEqual({
      message:
        'konfirmasi lembur hanya dapat dilakukan pada pukul 14:00 hingga 15:00',
      error: 'Conflict',
      statusCode: 409,
    });
  });

  it('should success to request overtime', async () => {
    changeDate(date, '06:20');
    const attendance = await request(app.getHttpServer())
      .post('/attendance')
      .set('authorization', `bearer ${token}`)
      .field('nik', nik)
      .field(
        'location',
        JSON.stringify({ latitude: -6.914744, longitude: 107.60981 }),
      )
      .field('type', 'check_in')
      .attach('photo', __dirname + '/files/user.png')
      .expect(201);

    changeDate(date, '14:20');
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ nik })
      .expect(201);

    expect(result.body).toEqual({
      id: expect.any(Number),
      approved: false,
      attendance_id: attendance.body.attendance_id,
      date,
    });

    await deleteData('overtime', { id: result.body.id });
    await deleteData('attendance', { id: attendance.body.attendance_id });
  });
});

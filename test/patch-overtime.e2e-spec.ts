import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';

describe('patch overtime e2e test', () => {
  const date = '2023-01-06';
  const nik = '001230045600701';

  let token: string;
  let app: INestApplication;
  let attendanceId: number;
  let overtimeId: number;
  let endpoint: string;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');

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

    attendanceId = attendance.body.attendance_id;

    changeDate(date, '14:20');
    const overtime = await request(app.getHttpServer())
      .post('/attendance/overtime')
      .set('authorization', `bearer ${token}`)
      .send({ nik })
      .expect(201);

    overtimeId = overtime.body.id;
    endpoint = `/monitoring/overtime/${overtimeId}`;
  });

  afterAll(async () => {
    app.close();

    await deleteData('attendance', { id: attendanceId });
    await deleteData('overtime', { id: overtimeId });
  });

  it('should return 400 status code for invalid request', async () => {
    const result = await request(app.getHttpServer())
      .patch(endpoint)
      .set('authorization', `bearer ${token}`)
      .expect(400);

    expect(result.body).toEqual({
      message: 'approved harus berisi nilai boolean yang valid!',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not exist overtime data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/monitoring/overtime/0')
      .set('authorization', `bearer ${token}`)
      .send({ approved: true })
      .expect(404);

    expect(result.body).toEqual({
      message: 'data lembur tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success to update overtime', async () => {
    const result = await request(app.getHttpServer())
      .patch(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ approved: true })
      .expect(200);

    expect(result.body).toEqual({ id: overtimeId, approved: true });
  });
});

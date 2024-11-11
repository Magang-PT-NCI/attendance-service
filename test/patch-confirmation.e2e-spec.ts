import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';

describe('patch confirmation e2e test', () => {
  const date = '2023-01-10';
  const nik = '001230045600701';

  let token: string;
  let app: INestApplication;
  let attendanceId: number;
  let confirmationId: number;
  let endpoint: string;

  beforeAll(async () => {
    app = await getApp();
    token = await getToken(nik, 'adityawijaya123');

    changeDate(date, '07:20');
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

    const confirmation = await request(app.getHttpServer())
      .post('/attendance/confirmation')
      .set('authorization', `bearer ${token}`)
      .field('attendance_id', attendanceId)
      .field('type', 'check_in')
      .field('description', 'lorem ipsum dolor sit amet')
      .attach('attachment', __dirname + '/files/test.txt')
      .expect(201);

    confirmationId = confirmation.body.id;
    endpoint = `/monitoring/confirmation/${confirmationId}`;
  });

  afterAll(async () => {
    app.close();

    await deleteData('attendanceConfirmation', { id: confirmationId });
    await deleteData('attendance', { id: attendanceId });
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

  it('should return 404 status code for not exist confirmation data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/monitoring/confirmation/0')
      .set('authorization', `bearer ${token}`)
      .send({ approved: true })
      .expect(404);

    expect(result.body).toEqual({
      message: 'data konfirmasi kehadiran tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success to update confirmation', async () => {
    const result = await request(app.getHttpServer())
      .patch(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ approved: true })
      .expect(200);

    expect(result.body).toEqual({ id: confirmationId, approved: true });
  });
});

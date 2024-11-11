import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';
import { APP_URL } from '../src/config/app.config';

describe('attendance confirmation e2e test', () => {
  const date = '2023-01-03';
  const endpoint = '/attendance/confirmation';
  const nik = '001230045600701';
  const attachment = __dirname + '/files/test.txt';

  let token: string;
  let app: INestApplication;
  let attendanceId: number;

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
  });

  afterAll(async () => {
    app.close();
    await deleteData('attendance', { id: attendanceId });
  });

  it('should return 400 status code for invalid request', async () => {
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('attendance_id', attendanceId)
      .field('description', 'lorem ipsum dolor sit amet')
      .attach('attachment', attachment)
      .expect(400);

    expect(result.body).toEqual({
      message: 'type harus diisi',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should success to request confirmation', async () => {
    changeDate(date, '14:20');
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('attendance_id', attendanceId)
      .field('type', 'check_in')
      .field('description', 'lorem ipsum dolor sit amet')
      .attach('attachment', attachment)
      .expect(201);

    expect(result.body).toEqual({
      id: expect.any(Number),
      attendance_id: attendanceId,
      type: 'check_in',
      description: 'lorem ipsum dolor sit amet',
      attachment: `${APP_URL}/files/confirmation/${attendanceId}_check_in_${date}.txt`,
      approved: false,
      reason: null,
    });

    await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .field('attendance_id', attendanceId)
      .field('type', 'check_in')
      .field('description', 'lorem ipsum dolor sit amet')
      .attach('attachment', attachment)
      .expect(409)
      .expect({
        message: 'Anda masih memiliki konfirmasi yang belum diperiksa!',
        error: 'Conflict',
        statusCode: 409,
      });

    await deleteData('attendanceConfirmation', { id: result.body.id });
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';

describe('post attendance e2e test', () => {
  const date = '2023-01-04';
  const nik = '001230045600701';
  const endpoint = '/logbook';

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
      .send({
        attendance_id: attendanceId,
        status: 'progress',
        start_time: '10:00',
        end_time: '11:30',
      })
      .expect(400);

    expect(result.body).toEqual({
      message: 'description harus diisi',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not exist attendance data', async () => {
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({
        attendance_id: 0,
        description: 'lorem ipsum dolor sit amet',
        status: 'progress',
        start_time: '10:00',
        end_time: '11:30',
      })
      .expect(404);

    expect(result.body).toEqual({
      message: 'data attendance tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success to create logbook', async () => {
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({
        attendance_id: attendanceId,
        description: 'lorem ipsum dolor sit amet',
        status: 'progress',
        start_time: '10:00',
        end_time: '11:30',
      })
      .expect(201);

    expect(result.body).toEqual({
      id: expect.any(Number),
      description: 'lorem ipsum dolor sit amet',
      status: 'progress',
      start_time: '10:00',
      end_time: '11:30',
    });

    await deleteData('activity', { id: result.body.id });
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { changeDate, deleteData, getApp, getToken } from './helper';

describe('patch attendance e2e test', () => {
  const date = '2023-01-05';
  const nik = '001230045600701';

  let token: string;
  let app: INestApplication;
  let attendanceId: number;
  let logbookId: number;
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

    const logbook = await request(app.getHttpServer())
      .post('/logbook')
      .set('authorization', `bearer ${token}`)
      .send({
        attendance_id: attendanceId,
        description: 'lorem ipsum dolor sit amet',
        status: 'progress',
        start_time: '10:00',
        end_time: '11:30',
      })
      .expect(201);

    logbookId = logbook.body.id;
    endpoint = `/logbook/${logbookId}`;
  });

  afterAll(async () => {
    app.close();

    await deleteData('activity', { id: logbookId });
    await deleteData('attendance', { id: attendanceId });
  });

  it('should return 400 status code for invalid request', async () => {
    const result = await request(app.getHttpServer())
      .patch('/logbook/abc')
      .set('authorization', `bearer ${token}`)
      .send({ status: 'done' })
      .expect(400);

    expect(result.body).toEqual({
      message: 'activity id harus berupa angka yang valid',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should return 404 status code for not exist logbook data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/logbook/0')
      .set('authorization', `bearer ${token}`)
      .send({ status: 'done' })
      .expect(404);

    expect(result.body).toEqual({
      message: 'logbook tidak ditemukan',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('should success to update logbook', async () => {
    const result = await request(app.getHttpServer())
      .patch(endpoint)
      .set('authorization', `bearer ${token}`)
      .send({ status: 'done' })
      .expect(200);

    expect(result.body).toEqual({
      id: expect.any(Number),
      description: 'lorem ipsum dolor sit amet',
      status: 'done',
      start_time: '10:00',
      end_time: '11:30',
    });
  });
});

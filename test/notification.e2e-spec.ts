import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  changeDate,
  deleteData,
  findAndDeleteData,
  getApp,
  getToken,
} from './helper';
import { getDateString } from '../src/utils/date.utils';
import { APP_URL } from '../src/config/app.config';

describe('notification e2e test', () => {
  const date = '2020-05-01';
  const nik = '001230045600701';
  const endpoint = '/notification';

  let tokenOnSite: string;
  let tokenCoordinator: string;
  let app: INestApplication;
  let permitId: number;
  let startDate: Date;

  beforeAll(async () => {
    app = await getApp();
    tokenOnSite = await getToken(nik, 'adityawijaya123');
    tokenCoordinator = await getToken('001230045600708', 'lestariwulandari123');

    startDate = new Date(date);
    startDate.setDate(startDate.getDate() + 1);

    await findAndDeleteData('permit', { nik, start_date: startDate });
    changeDate(date, '07:00');
    const permit = await request(app.getHttpServer())
      .post('/permit')
      .set('authorization', `bearer ${tokenOnSite}`)
      .field('nik', nik)
      .field('reason', 'sakit')
      .field('start_date', getDateString(startDate))
      .field('duration', 1)
      .attach('permission_letter', __dirname + '/files/test.txt')
      .expect(201);

    permitId = permit.body.id;
  });

  afterAll(async () => {
    app.close();
    await deleteData('permit', { id: permitId });
  });

  it('should success to get OnSite notification', async () => {
    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${tokenOnSite}`)
      .expect(200);

    expect(result.body).toContainEqual({
      nik,
      name: 'Aditya Wijaya Putra',
      message: `Pengajuan izin Anda untuk tanggal ${getDateString(startDate)} selama 1 hari belum disetujui oleh Koordinator.`,
      date: getDateString(new Date()),
      file: `${APP_URL}/files/permit/${nik}_${date}.txt`,
      action_endpoint: null,
    });
  });

  it('should success to get Coordinator notification', async () => {
    const result = await request(app.getHttpServer())
      .get(endpoint)
      .set('authorization', `bearer ${tokenCoordinator}`)
      .expect(200);

    expect(result.body).toContainEqual({
      nik,
      name: 'Aditya Wijaya Putra',
      message: `Mengajukan izin pada ${getDateString(startDate)} selama 1 hari dengan alasan "sakit".`,
      date: getDateString(new Date()),
      file: `${APP_URL}/files/permit/${nik}_${date}.txt`,
      action_endpoint: `/permit/${permitId}`,
    });
  });
});

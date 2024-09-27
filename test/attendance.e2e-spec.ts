import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AttendanceResBody } from '../src/dto/attendance.dto';
import { APP_URL, FILE_DESTINATION } from '../src/config/app.config';
import { Reason } from '@prisma/client';
import { getToken } from './utils/token.e2e.utils';

describe('Attendance Controller (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const date = '2024-09-02';
  const photo: string =
    FILE_DESTINATION === 'local'
      ? `${APP_URL}/default.png`
      : 'https://lh3.googleusercontent.com/d/17ZxcvViTexCuS_j_Vve2CKTyHG7iu0aY=s220';

  beforeAll(async () => {
    token = await getToken('001230045600701', 'adityawijaya123');
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('get attendance by nik', () => {
    it('should return 200 response code with presence attendance data', async () => {
      const activityStatus = ['progress', 'done'];
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      const location = { latitude: -6.914744, longitude: 107.60981 };
      let attendance: AttendanceResBody = null;

      const testAttendance = async (filter: string = '') => {
        const response = await request(app.getHttpServer())
          .get(`/attendance/001230045600701`)
          .set('authorization', `bearer ${token}`)
          .query({ date: date, filter })
          .expect(200);

        attendance = response.body as AttendanceResBody;

        expect(attendance.id).toBe(1);
        expect(attendance.date).toBe(date);
        expect(attendance.status).toBe('presence');
        expect(attendance.overtime).toBeNull();
        expect(attendance.working_hours).toBe('7 jam 45 menit');
        expect(attendance.late).toBeNull();
        expect(attendance.permit).toBeNull();
        expect(attendance.checkIn).toEqual({
          time: '06:20',
          photo,
          location: location,
        });
        expect(attendance.checkOut).toEqual({
          time: '14:05',
          photo,
          location: location,
        });

        return attendance;
      };

      const testActivities = (status: string = '') => {
        if (status === '' || status === 'all') {
          expect(attendance.activities).toHaveLength(3);
        }

        attendance.activities.forEach((activity) => {
          expect(typeof activity.id).toBe('number');
          expect(typeof activity.description).toBe('string');
          expect(timeRegex.test(activity.start_time)).toBe(true);
          expect(timeRegex.test(activity.end_time)).toBe(true);

          if (status === '') {
            expect(activityStatus.includes(activity.status)).toBe(true);
          } else {
            expect(activity.status).toBe(status);
          }
        });
      };

      await testAttendance();
      testActivities();
      await testAttendance('all');
      testActivities();
      await testAttendance('progress');
      testActivities('progress');
      await testAttendance('done');
      testActivities('done');
    });

    it('should return 200 response code with permit attendance data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/001230045600704`)
        .set('authorization', `bearer ${token}`)
        .query({ date })
        .expect(200);

      const attendance = response.body as AttendanceResBody;

      expect(attendance.id).toBe(4);
      expect(attendance.date).toBe(date);
      expect(attendance.status).toBe('permit');
      expect(attendance.overtime).toBeNull();
      expect(attendance.working_hours).toBeNull();
      expect(attendance.late).toBeNull();
      expect(attendance.checkIn).toBeNull();
      expect(attendance.checkOut).toBeNull();
      expect(attendance.activities).toHaveLength(0);

      const permit = attendance.permit;
      const permission_letter =
        FILE_DESTINATION === 'local'
          ? `${APP_URL}/default.txt`
          : 'https://drive.google.com/file/d/1xsCxPCsNJfoG7FPgO6nYXH2KHCgTQ-B8/view';
      const reasons: Reason[] = [
        'sakit',
        'urusan_mendadak',
        'cuti',
        'duka',
        'melahirkan',
        'lainnya',
      ];

      expect(permit.id).toBe(1);
      expect(permit.start_date).toBe(date);
      expect(permit.end_date).toBe('2024-09-04');
      expect(permit.duration).toBe(1);
      expect(permit.permission_letter).toBe(permission_letter);
      expect(permit.approved).toBe(true);
      expect(reasons.includes(permit.reason)).toBe(true);
    });

    it('should return 200 response code with absent attendance data', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/001230045600703`)
        .set('authorization', `bearer ${token}`)
        .query({ date })
        .expect(200)
        .expect({
          id: 3,
          date,
          status: 'absent',
          overtime: null,
          working_hours: null,
          late: null,
          checkIn: null,
          checkOut: null,
          permit: null,
          activities: [],
        });
    });

    it('should return 204 response code with not existing attendance data', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/001230045600701`)
        .set('authorization', `bearer ${token}`)
        .expect(204);
    });

    it('should return 404 response code with not existing employee', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/001230045600700`)
        .set('authorization', `bearer ${token}`)
        .expect(404)
        .expect({
          message: 'karyawan tidak ditemukan',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('should return correct overtime data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/001230045600702`)
        .set('authorization', `bearer ${token}`)
        .query({ date: date })
        .expect(200);

      expect((response.body as AttendanceResBody).overtime).toBe(
        '1 jam 2 menit',
      );
    });

    it('should return correct late data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/001230045600705`)
        .set('authorization', `bearer ${token}`)
        .query({ date: date })
        .expect(200);

      expect((response.body as AttendanceResBody).late).toBe('20 menit');
    });
  });
});

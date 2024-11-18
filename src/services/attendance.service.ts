import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceConfirmationReqBody,
  AttendanceConfirmationResBody,
  AttendancePostReqBody,
  AttendancePostResBody,
  AttendanceResBody,
  OvertimeResBody,
} from '../dto/attendance.dto';
import { Attendance, CurrentDate } from '../interfaces/attendance.interfaces';
import { getEmployee } from '../utils/api.utils';
import { getDate, getDateString, getTimeString } from '../utils/date.utils';
import { uploadFile } from '../utils/upload.utils';
import { ActivityStatus, Prisma } from '@prisma/client';
import { handleError } from '../utils/common.utils';
import { BaseService } from './base.service';

@Injectable()
export class AttendanceService extends BaseService {
  public async handleGetAttendance(
    nik: string,
    filter: string,
    date: string,
  ): Promise<AttendanceResBody> {
    const employee = await getEmployee(nik);
    if (!employee) throw new NotFoundException('karyawan tidak ditemukan');

    const where: Prisma.AttendanceWhereInput = { nik, date: getDate(date) };
    const select = this.buildSelectGetAttendance(filter);

    try {
      const attendance: Attendance = await this.prisma.attendance.findFirst({
        where,
        select,
      });
      return attendance ? new AttendanceResBody(attendance) : null;
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleCheckIn(
    data: AttendancePostReqBody,
  ): Promise<AttendancePostResBody> {
    const { nik, location, type, photo } = data;
    const { current, currentDateIso, currentTimeIso } = this.getCurrentDate();

    this.validateCheckInTime(current);
    const attendance = await this.checkExistingAttendance(nik, currentDateIso);

    const filename = await uploadFile(photo, nik, type);

    try {
      const result: Attendance = await this.prisma.$transaction(
        async (prisma) => {
          const checkIn = await prisma.check.create({
            data: {
              type: 'in',
              time: currentTimeIso,
              location: `${location.latitude},${location.longitude}`,
              photo: filename,
            },
          });

          if (attendance) {
            return prisma.attendance.update({
              where: { id: attendance.id },
              data: {
                nik,
                check_in_id: checkIn.id,
                date: currentDateIso,
                status: 'presence',
              },
              select: {
                id: true,
                checkIn: true,
                checkOut: true,
              },
            });
          }

          return prisma.attendance.create({
            data: {
              nik,
              check_in_id: checkIn.id,
              date: currentDateIso,
              status: 'presence',
            },
            select: {
              id: true,
              checkIn: true,
              checkOut: true,
            },
          });
        },
      );

      return new AttendancePostResBody(data, result);
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleCheckOut(
    data: AttendancePostReqBody,
  ): Promise<AttendancePostResBody> {
    const { nik, location, type, photo } = data;
    const { current, currentDateIso, currentTimeIso } = this.getCurrentDate();

    const attendance = await this.getAttendanceData(nik, currentDateIso);

    if (!attendance?.checkIn)
      throw new ConflictException('tidak dapat check out sebelum check in');

    if (attendance.check_out_id)
      throw new ConflictException('check out telah dilakukan');

    if (attendance.activities.length < 1)
      throw new ConflictException('harus mengisi logbook terlebih dahulu');

    // not overtime
    if (current.getHours() > 15 && !attendance.overtime_id)
      throw new ConflictException(
        'tidak dapat melakukan check out setelah pukul 15:00',
      );

    // overtime
    if (current.getHours() >= 19 && attendance.overtime_id)
      throw new ConflictException(
        'tidak dapat melakukan check out setelah pukul 19:00',
      );

    try {
      const filename = await uploadFile(photo, nik, type);

      const result: Attendance = await this.prisma.$transaction(
        async (prisma) => {
          const checkOut = await prisma.check.create({
            data: {
              type: 'out',
              time: currentTimeIso,
              location: `${location.latitude},${location.longitude}`,
              photo: filename,
            },
          });

          return prisma.attendance.update({
            where: { id: attendance.id },
            data: { check_out_id: checkOut.id },
            select: {
              id: true,
              checkIn: true,
              checkOut: true,
            },
          });
        },
      );

      return new AttendancePostResBody(data, result);
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleOvertime(nik: string): Promise<OvertimeResBody> {
    const { current, currentDateIso } = this.getCurrentDate();

    if (current.getHours() < 14 || current.getHours() >= 15)
      throw new ConflictException(
        'konfirmasi lembur hanya dapat dilakukan pada pukul 14:00 hingga 15:00',
      );

    const employee = await getEmployee(nik);
    if (!employee) throw new NotFoundException('karyawan tidak ditemukan');

    const attendance = await this.getAttendanceData(nik, currentDateIso);

    if (!attendance?.checkIn)
      throw new ConflictException(
        'tidak dapat melakukan konfirmasi lembur karena belum melakukan check in',
      );

    if (attendance?.check_out_id)
      throw new ConflictException(
        'tidak dapat melakukan konfirmasi lembur karena telah melakukan check out',
      );

    if (attendance.overtime_id)
      throw new ConflictException('telah melakukan konfirmasi lembur');

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const overtime = await prisma.overtime.create({
          data: { approved: false, checked: false },
        });
        const createAttendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: { overtime_id: overtime.id },
        });
        return new OvertimeResBody(overtime, createAttendance);
      });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleAttendanceConfirmation(
    data: AttendanceConfirmationReqBody,
  ): Promise<AttendanceConfirmationResBody> {
    try {
      const filename = await uploadFile(
        data.attachment,
        `${data.attendance_id}_${data.type}`,
        'confirmation',
      );

      const existingConfirmation =
        await this.prisma.attendanceConfirmation.findFirst({
          where: { attendance_id: data.attendance_id, checked: false },
          select: { id: true },
        });

      if (existingConfirmation)
        throw new ConflictException(
          'Anda masih memiliki konfirmasi yang belum diperiksa!',
        );

      return new AttendanceConfirmationResBody(
        await this.prisma.attendanceConfirmation.create({
          data: {
            type: data.type,
            attendance_id: data.attendance_id,
            description: data.description,
            attachment: filename,
            reason: data.reason,
            checked: false,
            approved: false,
          },
        }),
      );
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private buildSelectGetAttendance(filter: string): Prisma.AttendanceSelect {
    return {
      id: true,
      date: true,
      status: true,
      checkIn: { select: { time: true, location: true, photo: true } },
      checkOut: { select: { time: true, location: true, photo: true } },
      activities: {
        select: {
          id: true,
          description: true,
          status: true,
          start_time: true,
          end_time: true,
        },
        where:
          filter !== 'all' ? { status: filter as ActivityStatus } : undefined,
      },
      permit: true,
    };
  }

  private getCurrentDate(): CurrentDate {
    const current = getDate(new Date().toISOString());
    return {
      current,
      currentDateIso: getDate(getDateString(current)).toISOString(),
      currentTimeIso: getDate(getTimeString(current)).toISOString(),
    };
  }

  private validateCheckInTime(current: Date) {
    const hour = current.getHours();
    const minute = current.getMinutes();

    if (hour < 6)
      throw new ConflictException(
        'tidak dapat melakukan check in sebelum pukul 06:00',
      );

    if (hour > 9 || (hour >= 9 && minute > 0))
      throw new ConflictException(
        'tidak dapat melakukan check in setelah pukul 09:00',
      );
  }

  private async getAttendanceData(
    nik: string,
    date: string,
    includeCheckIn: boolean = false,
  ): Promise<Attendance> {
    try {
      return await this.prisma.attendance.findFirst({
        where: {
          nik,
          date,
        },
        include: includeCheckIn ? { checkIn: true } : undefined,
      });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private async checkExistingAttendance(
    nik: string,
    date: string,
  ): Promise<Attendance> {
    const attendance = await this.getAttendanceData(nik, date);
    if (attendance?.check_in_id || attendance?.permit_id)
      throw new ConflictException(
        'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
      );

    return attendance;
  }
}

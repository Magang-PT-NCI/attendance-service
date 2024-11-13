import { PrismaClient, Reason } from '@prisma/client';
import { createLogbook } from './logbookSeedUtil';

const prisma: PrismaClient = new PrismaClient();

const getTime = (time: string): string => `1970-01-01T${time}:00.000Z`;

const photo = '17ZxcvViTexCuS_j_Vve2CKTyHG7iu0aY';

export const dateStart = process.env.DATE_START?.split('-');
export const date = dateStart ? process.env.DATE_START : '2024-01-01';

export const overtimeCheckOutTimes = [
  '17:01',
  '16:22',
  '17:30',
  '16:03',
  '15:43',
];

export interface EmployeeGenerateItem {
  nik: string;
  name: string;
  area: string;
  location: string;
  date: Date;
}

const nextDate = (employee: EmployeeGenerateItem): string => {
  const current = employee.date.toISOString();

  employee.date.setDate(employee.date.getDate() + 1);
  if (employee.date.getDay() === 0)
    employee.date.setDate(employee.date.getDate() + 1);

  return current;
};

export const createAttendance = async (
  employee: EmployeeGenerateItem,
  checkInTime: string = null,
  checkOutTime: string = null,
): Promise<number> => {
  const { nik, location } = employee;

  let checkInId = null;
  let checkOutId = null;

  if (checkInTime) {
    const checkIn = await prisma.check.create({
      data: { type: 'in', time: getTime(checkInTime), location, photo },
      select: {
        id: true,
        type: false,
        time: true,
        location: false,
        photo: false,
      },
    });
    checkInId = checkIn.id;
  }

  if (checkOutTime) {
    const checkOut = await prisma.check.create({
      data: { type: 'out', time: getTime(checkOutTime), location, photo },
      select: {
        id: true,
        type: false,
        time: true,
        location: false,
        photo: false,
      },
    });
    checkOutId = checkOut.id;
  }

  const status = checkInTime ? 'presence' : 'absent';
  const overtime = overtimeCheckOutTimes.includes(checkOutTime)
    ? await prisma.overtime.create({ data: { approved: true, checked: true } })
    : undefined;

  const attendance = await prisma.attendance.create({
    data: {
      check_in_id: checkInId,
      check_out_id: checkOutId,
      nik: nik,
      date: nextDate(employee),
      status,
      overtime_id: overtime?.id,
    },
  });

  if (status === 'presence') {
    await createLogbook(attendance.id);
  }

  return attendance.id;
};

export const createPermit = async (employee: EmployeeGenerateItem) => {
  const reasons: Reason[] = [
    'sakit',
    'urusan_mendadak',
    'cuti',
    'duka',
    'melahirkan',
    'lainnya',
  ];
  const date = nextDate(employee);

  const permit = await prisma.permit.create({
    data: {
      nik: employee.nik,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      start_date: date,
      duration: 1,
      permission_letter: '1xsCxPCsNJfoG7FPgO6nYXH2KHCgTQ-B8',
      approved: true,
      checked: true,
    },
  });

  await prisma.attendance.create({
    data: {
      permit_id: permit.id,
      nik: employee.nik,
      date,
      status: 'permit',
    },
  });
};

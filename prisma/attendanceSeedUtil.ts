import { PrismaClient, Reason } from '@prisma/client';
import { createLogbook } from './logbookSeedUtil';

const prisma: PrismaClient = new PrismaClient();

const getDate = (date: string): string => `${date}T00:00:00.000Z`;
const getTime = (time: string): string => `1970-01-01T${time}:00.000Z`;

const photo: string = '17ZxcvViTexCuS_j_Vve2CKTyHG7iu0aY';

const year: number = 2024;
const month: number = 9;

export const overtimeCheckOutTimes = [
  '17:01',
  '16:22',
  '17:30',
  '16:03',
  '15:43',
];

const nextDate = (employee) => {
  employee.dateCount++;

  const dateString: string = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${employee.dateCount.toString().padStart(2, '0')}`;
  const date: Date = new Date(dateString);

  if (date.getDay() === 6) employee.dateCount++;

  return dateString;
};

export const createAttendance = async (
  employee,
  checkInTime = null,
  checkOutTime = null,
) => {
  const { nik, location } = employee;

  let checkInId = null;
  let checkOutId = null;

  if (checkInTime && checkOutTime) {
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

  const status = checkInTime && checkOutTime ? 'presence' : 'absent';
  const overtime = overtimeCheckOutTimes.includes(checkOutTime)
    ? await prisma.overtime.create({ data: { approved: true } })
    : undefined;

  const attendance = await prisma.attendance.create({
    data: {
      check_in_id: checkInId,
      check_out_id: checkOutId,
      nik: nik,
      date: getDate(nextDate(employee)),
      status,
      overtime_id: overtime?.id,
    },
  });

  if (status === 'presence') {
    await createLogbook(attendance.id);
  }
};

export const createPermit = async (employee) => {
  const reasons: Reason[] = [
    'sakit',
    'urusan_mendadak',
    'cuti',
    'duka',
    'melahirkan',
    'lainnya',
  ];
  const date = getDate(nextDate(employee));

  const permit = await prisma.permit.create({
    data: {
      nik: employee.nik,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      start_date: date,
      duration: 1,
      permission_letter: '1xsCxPCsNJfoG7FPgO6nYXH2KHCgTQ-B8',
      approved: true,
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

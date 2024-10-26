import { ConfirmationType, PrismaClient, Reason } from '@prisma/client';
import {
  createAttendance,
  createPermit,
  date,
  dateStart,
  EmployeeGenerateItem,
  overtimeCheckOutTimes,
} from './attendanceSeedUtil';

const prisma = new PrismaClient();
const dayCount = process.env.DATE_COUNT ? parseInt(process.env.DATE_COUNT) : 25;

const locations = {
  bandung: '-6.914744,107.609810',
  cimahi: '-6.920744,107.607810',
};

const employees: EmployeeGenerateItem[] = [
  {
    nik: '001230045600701',
    name: 'Aditya Wijaya Putra',
    location: locations.bandung,
    dateCount: date - 1,
  },
  {
    nik: '001230045600702',
    name: 'Rina Andriani',
    location: locations.bandung,
    dateCount: date - 1,
  },
  {
    nik: '001230045600703',
    name: 'Budi Santoso',
    location: locations.cimahi,
    dateCount: date - 1,
  },
  {
    nik: '001230045600704',
    name: 'Maria Hadiyanti',
    location: locations.bandung,
    dateCount: date - 1,
  },
  {
    nik: '001230045600705',
    name: 'Dewa Prasetyo',
    location: locations.cimahi,
    dateCount: date - 1,
  },
  {
    nik: '001230045600706',
    name: 'Dini Kusuma Wardani',
    location: locations.bandung,
    dateCount: date - 1,
  },
  {
    nik: '001230045600707',
    name: 'Arif Rahman Hakim',
    location: locations.cimahi,
    dateCount: date - 1,
  },
  {
    nik: '001230045600709',
    name: 'Indra Gunawan',
    location: locations.bandung,
    dateCount: date - 1,
  },
  {
    nik: '001230045600710',
    name: 'Siti Fatimah',
    location: locations.bandung,
    dateCount: date - 1,
  },
  {
    nik: '001230045600711',
    name: 'Agus Supriadi',
    location: locations.cimahi,
    dateCount: date - 1,
  },
];

const employeeCacheData = employees.map((employee) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { location, dateCount, ...employeeCache } = employee;
  return employeeCache;
});

const checkInTimes = [
  '06:37',
  '07:02',
  '06:55',
  '06:52',
  '06:48',
  '06:41',
  '06:45',
];
const checkOutTimes = [
  '14:01',
  '14:10',
  '14:08',
  '14:02',
  '14:09',
  '14:12',
  '14:04',
];

const createConfirmation = async (
  attendance_id: number,
  type: ConfirmationType,
  description: string,
  reason?: Reason,
) => {
  await prisma.attendanceConfirmation.create({
    data: {
      attendance_id,
      type,
      description,
      attachment: '1xsCxPCsNJfoG7FPgO6nYXH2KHCgTQ-B8',
      checked: false,
      approved: false,
      reason,
    },
  });
};

const createUncheckedOvertime = async (attendance_id: number) => {
  const overtime = await prisma.overtime.create({
    data: { approved: false, checked: false },
    select: { id: true },
  });
  await prisma.attendance.update({
    where: { id: attendance_id },
    data: { overtime_id: overtime.id },
    select: { id: true },
  });
};

const createLaterPermit = async (
  nik: string,
  reason: Reason,
  start_date: Date,
  duration: number,
) => {
  await prisma.permit.create({
    data: {
      nik,
      reason,
      start_date,
      duration,
      permission_letter: '1xsCxPCsNJfoG7FPgO6nYXH2KHCgTQ-B8',
      checked: false,
      approved: false,
    },
  });
};

const main = async () => {
  await prisma.employeeCache.createMany({ data: employeeCacheData });

  for (const employee of employees) {
    for (let i = 0; i < dayCount - 1; i++) {
      const rand = Math.random();

      if (rand < 0.03) {
        // 3% absent
        await createAttendance(employee); // Absent
      } else if (rand < 0.1) {
        // 7% permit
        await createPermit(employee);
      } else {
        // 90% present

        const randomIndex = Math.floor(Math.random() * checkInTimes.length);
        const checkInTime = checkInTimes[randomIndex];
        let checkOutTime = checkOutTimes[randomIndex];

        if (rand < 0.2) {
          // 10% lembur
          checkOutTime =
            overtimeCheckOutTimes[
              Math.floor(Math.random() * overtimeCheckOutTimes.length)
            ];
        }

        await createAttendance(employee, checkInTime, checkOutTime); // Present
      }
    }
  }

  await createAttendance(employees[0], '06:53', overtimeCheckOutTimes[0]);
  await createAttendance(employees[1], '06:50', '14:00');
  await createAttendance(employees[2]);
  await createPermit(employees[3]);
  await createAttendance(employees[4], '07:22', '14:05');

  let id = await createAttendance(employees[5]);
  await createConfirmation(id, 'check_in', 'saya lupa check in');

  id = await createAttendance(employees[6]);
  await createConfirmation(
    id,
    'permit',
    'saya ada keperluan mendesak',
    'urusan_mendadak',
  );

  id = await createAttendance(employees[7], '07:30', null);
  await createConfirmation(id, 'check_in', 'saya lupa check in tepat waktu');

  id = await createAttendance(employees[8], '06:55', null);
  await createConfirmation(id, 'check_out', 'saya lupa check out');

  id = await createAttendance(employees[9], '06:53', null);
  await createUncheckedOvertime(id);

  await createLaterPermit(
    employees[0].nik,
    'cuti',
    new Date(
      `${dateStart[0]}-${dateStart[1]}-${`${date + dayCount + 3}`.padStart(2, '0')}`,
    ),
    2,
  );
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

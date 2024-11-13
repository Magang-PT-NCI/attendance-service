import { ConfirmationType, PrismaClient, Reason } from '@prisma/client';
import {
  createAttendance,
  createPermit,
  date,
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
    area: 'Bandung',
    location: locations.bandung,
    date: new Date(date),
  },
  {
    nik: '001230045600702',
    name: 'Rina Andriani',
    area: 'Bandung',
    location: locations.bandung,
    date: new Date(date),
  },
  {
    nik: '001230045600703',
    name: 'Budi Santoso',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
  {
    nik: '001230045600704',
    name: 'Maria Hadiyanti',
    area: 'Bandung',
    location: locations.bandung,
    date: new Date(date),
  },
  {
    nik: '001230045600705',
    name: 'Dewa Prasetyo',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
  {
    nik: '001230045600706',
    name: 'Dini Kusuma Wardani',
    area: 'Bandung',
    location: locations.bandung,
    date: new Date(date),
  },
  {
    nik: '001230045600707',
    name: 'Arif Rahman Hakim',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
  {
    nik: '001230045600709',
    name: 'Indra Gunawan',
    area: 'Bandung',
    location: locations.bandung,
    date: new Date(date),
  },
  {
    nik: '001230045600710',
    name: 'Siti Fatimah',
    area: 'Bandung',
    location: locations.bandung,
    date: new Date(date),
  },
  {
    nik: '001230045600711',
    name: 'Agus Supriadi',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
  {
    nik: '001230045600712',
    name: 'Retno Maharani',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
  {
    nik: '001230045600713',
    name: 'Eko Saputro',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
  {
    nik: '001230045600714',
    name: 'Yuli Kartika Sari',
    area: 'Cimahi',
    location: locations.cimahi,
    date: new Date(date),
  },
];

const employeeCacheData = employees.map((employee) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { location, date, ...employeeCache } = employee;
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
  start_date,
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

  let id = await createAttendance(employees[6], '07:10', null);
  await createConfirmation(id, 'check_in', 'saya lupa check in tepat waktu');

  id = await createAttendance(employees[7], '06:53', null);
  await createUncheckedOvertime(id);

  const permitDate = new Date(employees[8].date);
  permitDate.setDate(permitDate.getDate() + 3);

  await createLaterPermit(employees[8].nik, 'cuti', permitDate, 2);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

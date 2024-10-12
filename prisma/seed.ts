import { PrismaClient } from '@prisma/client';
import { createAttendance, createPermit, overtimeCheckOutTimes } from './attendanceSeedUtil';

const prisma = new PrismaClient();
const dateStart = 7;
const dayCount = 13;

const locations = {
  bandung: '-6.914744,107.609810',
  cimahi: '-6.920744,107.607810',
};

const employees = [
  {
    nik: '001230045600701',
    name: 'Aditya Wijaya Putra',
    location: locations.bandung,
    dateCount: dateStart - 1,
  },
  {
    nik: '001230045600702',
    name: 'Rina Andriani',
    location: locations.bandung,
    dateCount: dateStart - 1,
  },
  {
    nik: '001230045600703',
    name: 'Budi Santoso',
    location: locations.cimahi,
    dateCount: dateStart - 1,
  },
  {
    nik: '001230045600704',
    name: 'Maria Hadiyanti',
    location: locations.bandung,
    dateCount: dateStart - 1,
  },
  {
    nik: '001230045600705',
    name: 'Dewa Prasetyo',
    location: locations.cimahi,
    dateCount: dateStart - 1,
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

const main = async () => {
  await prisma.employeeCache.createMany({ data: employeeCacheData });

  await createAttendance(employees[0], '06:20', '14:05');
  await createAttendance(employees[1], '06:55', '16:02');
  await createAttendance(employees[2]);
  await createPermit(employees[3]);
  await createAttendance(employees[4], '07:20', '14:10');

  for (const employee of employees) {
    for (let i = 0; i < dayCount - 2; i++) {
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

  await createAttendance(employees[0], '06:53', '14:01');
  await createAttendance(employees[1], '06:50', '14:00');
  await createAttendance(employees[2]);
  await createPermit(employees[3]);
  await createAttendance(employees[4], '07:22', '14:05');
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

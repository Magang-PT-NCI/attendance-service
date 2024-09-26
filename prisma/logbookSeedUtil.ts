import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient();

const activities: string[] = [
  'Meeting with client',
  'Code review',
  'Design brainstorming',
  'API development',
  'Project update meeting',
  'Debugging session',
  'Documentation writing',
  'Team retrospective',
  'Client feedback analysis',
  'Feature planning',
  'Backend integration',
  'Sprint planning',
  'Code testing',
  'Research on geofencing',
  'Team sync-up',
  'Database optimization',
  'Frontend design review',
  'Client demo preparation',
];

const getRandomActivities = (): string[] => {
  const shuffledActivities: string[] = [...activities];
  for (let i: number = shuffledActivities.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1));
    [shuffledActivities[i], shuffledActivities[j]] = [
      shuffledActivities[j],
      shuffledActivities[i],
    ];
  }

  return shuffledActivities.slice(0, 3);
};

const getTime = (time: string): string => `1970-01-01T${time}:00.000Z`;

export const createLogbook = async (attendance_id: number): Promise<void> => {
  const descriptions: string[] = getRandomActivities();
  const start_times: string[] = ['07:00', '09:15', '13:00'];
  const end_times: string[] = ['08:55', '11:20', '14:00'];
  const data = [];

  for (let i: number = 0; i < descriptions.length; i++) {
    data.push({
      attendance_id,
      description: descriptions[i],
      status: Math.random() < 0.5 ? 'progress' : 'done',
      start_time: getTime(start_times[i]),
      end_time: getTime(end_times[i]),
    });
  }

  await prisma.activity.createMany({ data });
};

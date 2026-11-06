import { PrismaClient } from '@prisma/client';
import { seed } from './seed';

const prisma = new PrismaClient();

seed(prisma)
  .then(() => console.warn('Seed completed'))
  .catch((e: unknown) => {
    console.error('Seed failed', e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());

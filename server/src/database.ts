import { PrismaClient } from '@prisma/client';
import config from './config';

const prisma = new PrismaClient();
let connected = false;

export const connectDatabase = async (): Promise<void> => {
  if (connected) return;
  if (!config.databaseUrl) {
    console.warn('DATABASE_URL not set; running without persistent storage');
    return;
  }
  await prisma.$connect();
  connected = true;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!connected) return;
  await prisma.$disconnect();
  connected = false;
};

export const getPrismaClient = (): PrismaClient => prisma;

import { PrismaClient } from './generated';

export * from './generated';

export const db = new PrismaClient();

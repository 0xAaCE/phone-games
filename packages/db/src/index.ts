import { PrismaClient } from './generated/index.js';

export * from './generated/index.js';

export const db = new PrismaClient();

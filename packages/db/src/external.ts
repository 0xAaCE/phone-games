// Public API exports for @phone-games/db package

import { PrismaClient } from './generated/index.js';

export * from './generated/index.js';

export const db = new PrismaClient();

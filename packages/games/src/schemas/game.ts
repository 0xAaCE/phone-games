import { z } from 'zod';
import { GAME_NAMES } from '../constants/index.js';

export const ValidGamesSchema = z.enum(Object.values(GAME_NAMES));
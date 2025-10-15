import { z } from 'zod';
import { GAME_NAMES } from '../internal.js';

export const ValidGamesSchema = z.enum(Object.values(GAME_NAMES));
import { z } from "zod";

import { GAME_NAMES } from "../constants/game";

export const validGameSchemas = z.enum(GAME_NAMES);
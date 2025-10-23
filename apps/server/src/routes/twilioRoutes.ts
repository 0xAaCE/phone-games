import { Router } from 'express';
import { TwilioController } from '../controllers/twilioController.js';
import { MessageHandlerService } from '@phone-games/messaging';
import { ILogger } from '@phone-games/logger';

export function createTwilioRouter(messageHandlerService: MessageHandlerService, logger: ILogger): Router {
    const router = Router();
    const twilioController = new TwilioController(messageHandlerService, logger);

    // Twilio webhook route
    router.post('/', twilioController.handleWebhook);

    return router;
}

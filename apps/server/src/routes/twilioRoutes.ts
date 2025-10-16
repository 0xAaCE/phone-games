import { Router } from 'express';
import { TwilioController } from '../controllers/twilioController.js';
import { MessageHandlerService } from '@phone-games/messaging';

export function createTwilioRouter(messageHandlerService: MessageHandlerService): Router {
    const router = Router();
    const twilioController = new TwilioController(messageHandlerService);

    // Twilio webhook route
    router.post('/', twilioController.handleWebhook);

    return router;
}

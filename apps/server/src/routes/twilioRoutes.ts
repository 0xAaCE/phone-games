import { type Router as RouterType } from 'express';
import { TwilioController } from '../controllers/TwilioController.js';

export const applyTwilioRoutes = (router: RouterType, twilioController: TwilioController) => {
    // Twilio webhook route
    router.post('/', twilioController.handleWebhook);
}

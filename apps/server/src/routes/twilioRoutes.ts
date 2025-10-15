import { type Router as RouterType } from 'express';
import { TwilioController } from '../controllers/twilioController.js';

export const applyTwilioRoutes = (router: RouterType, twilioController: TwilioController) => {
    // Twilio webhook route
    router.post('/', twilioController.handleWebhook);
}

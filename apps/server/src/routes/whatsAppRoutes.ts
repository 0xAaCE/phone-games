import { type Router as RouterType } from 'express';
import { WhatsAppController } from '../controllers/WhatsAppController.js';

export const applyWhatsAppRoutes = (router: RouterType, whatsAppController: WhatsAppController) => {
    // Public routes
    router.get('/', whatsAppController.verifyWebhook);
    router.post('/', whatsAppController.handleWebhook);
}
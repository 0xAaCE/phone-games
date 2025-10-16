import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsAppController.js';
import { MessageHandlerService } from '@phone-games/messaging';

export function createWhatsAppRouter(messageHandlerService: MessageHandlerService): Router {
    const router = Router();
    const whatsAppController = new WhatsAppController(messageHandlerService);

    // Public routes
    router.get('/', whatsAppController.verifyWebhook);
    router.post('/', whatsAppController.handleWebhook);

    return router;
}
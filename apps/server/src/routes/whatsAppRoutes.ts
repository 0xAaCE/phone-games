import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsAppController.js';
import { MessageHandlerService } from '@phone-games/messaging';
import { ILogger } from '@phone-games/logger';

export function createWhatsAppRouter(messageHandlerService: MessageHandlerService, logger: ILogger): Router {
    const router = Router();
    const whatsAppController = new WhatsAppController(messageHandlerService, logger);

    // Public routes
    router.get('/', whatsAppController.verifyWebhook);
    router.post('/', whatsAppController.handleWebhook);

    return router;
}
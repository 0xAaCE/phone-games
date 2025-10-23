import { MessageHandlerService } from '@phone-games/messaging';
import { ILogger } from '@phone-games/logger';
import { Request, Response } from 'express';

export class WhatsAppController {
  // private messageHandlerService: MessageHandlerService;
  private logger: ILogger;

  constructor(_messageHandlerService: MessageHandlerService, logger: ILogger) {
    // this.whatsAppService = new WhatsAppService();
    // this.messageHandlerService = messageHandlerService;
    this.logger = logger.child({ controller: 'WhatsAppController' });
  }

  verifyWebhook = async (req: Request, res: Response) => {
    const { "hub.challenge": challenge, "hub.mode": mode, "hub.verify_token": token } = req.query;

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Forbidden' });

  }

  handleWebhook = async (_req: Request, res: Response) => {
    // const { body } = req;
    this.logger.info('WhatsApp webhook received');

    // await this.messageHandlerService.handle(MessagePlatform.WHATSAPP, body);

    return res.status(200).send('OK');
  }
}
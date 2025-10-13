import { MessageHandlerService, MessagePlatform } from '@phone-games/messaging';
import { Request, Response } from 'express';

export class WhatsAppController {
  private messageHandlerService: MessageHandlerService;

  constructor(messageHandlerService: MessageHandlerService) {
    // this.whatsAppService = new WhatsAppService();
    this.messageHandlerService = messageHandlerService;
  }

  verifyWebhook = async (req: Request, res: Response) => {
    const { "hub.challenge": challenge, "hub.mode": mode, "hub.verify_token": token } = req.query;

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Forbidden' });

  }

  handleWebhook = async (req: Request, res: Response) => {
    const { body } = req;

    await this.messageHandlerService.handle(MessagePlatform.WHATSAPP, body);

    return res.status(200).send('OK');
  }
}
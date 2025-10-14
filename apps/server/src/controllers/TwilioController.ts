import { MessageHandlerService, MessagePlatform } from '@phone-games/messaging';
import { Request, Response } from 'express';

export class TwilioController {
  private messageHandlerService: MessageHandlerService;

  constructor(messageHandlerService: MessageHandlerService) {
    this.messageHandlerService = messageHandlerService;
  }

  handleWebhook = async (req: Request, res: Response) => {
    const body = req.body;
    console.log("Twilio Webhook Received\n");

    await this.messageHandlerService.handle(MessagePlatform.TWILIO, body);

    // Twilio expects a 200 response
    return res.status(200).send('OK');
  }
}

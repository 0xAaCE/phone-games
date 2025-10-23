import { MessageHandlerService, MessagePlatform } from '@phone-games/messaging';
import { ILogger } from '@phone-games/logger';
import { Request, Response } from 'express';

export class TwilioController {
  private messageHandlerService: MessageHandlerService;
  private logger: ILogger;

  constructor(messageHandlerService: MessageHandlerService, logger: ILogger) {
    this.messageHandlerService = messageHandlerService;
    this.logger = logger.child({ controller: 'TwilioController' });
  }

  handleWebhook = async (req: Request, res: Response) => {
    const body = req.body;
    this.logger.info('Twilio webhook received', { from: body.From, messageSid: body.MessageSid });

    await this.messageHandlerService.handle(MessagePlatform.TWILIO, body);

    // Twilio expects a 200 response
    return res.status(200).send('OK');
  }
}

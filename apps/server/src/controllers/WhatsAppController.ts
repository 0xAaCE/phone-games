import { Request, Response } from 'express';

export class WhatsAppController {
  constructor() {
    // this.whatsAppService = new WhatsAppService();
  }

  verifyWebhook = async (req: Request, res: Response) => {
    const { challenge, mode, token } = req.query;

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
      res.status(200).send(challenge);
    }
  }

  handleWebhook = async (req: Request, res: Response) => {
    const { body } = req;

    console.log(JSON.stringify(body, null, 2));

    res.status(200).send('OK');
  }
}
import { Request, Response } from 'express';

export class WhatsAppController {
  constructor() {
    // this.whatsAppService = new WhatsAppService();
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

    console.log(JSON.stringify(body, null, 2));

    return res.status(200).send('OK');
  }
}
import { Router } from 'express';
import { QrCodeController } from '../controllers/qrCodeController.js';
import { ILogger } from '@phone-games/logger';

/**
 * Creates QR code routes
 *
 * Registers routes for generating and serving party invitation QR codes.
 *
 * @param logger - Logger instance
 * @returns Express router with QR code routes
 *
 * @example
 * ```typescript
 * const qrRoutes = createQrCodeRoutes(logger);
 * app.use('/api/qr', qrRoutes);
 * ```
 */
export function createQrCodeRoutes(logger: ILogger): Router {
  const router = Router();
  const controller = new QrCodeController(logger);

  /**
   * GET /api/qr?partyId=<partyId>&phoneNumber=<phoneNumber>
   *
   * Generates and serves QR code PNG for party invitation
   *
   * @query partyId - Party unique identifier
   * @query phoneNumber - Phone number to use for WhatsApp link
   * @returns PNG image (image/png)
   *
   * @example
   * ```bash
   * curl "https://api.example.com/api/qr?partyId=clxy7z8k00001&phoneNumber=%2B1234567890" -o qr.png
   * ```
   */
  router.get('/', (req, res) => controller.generatePartyQR(req, res));

  return router;
}

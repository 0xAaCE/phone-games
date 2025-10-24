import { Router } from 'express';
import { QrCodeController } from '../controllers/qrCodeController.js';
import { ILogger } from '@phone-games/logger';

/**
 * Creates QR code routes
 *
 * Registers routes for generating and serving party invitation QR codes.
 *
 * @param db - Database client
 * @param logger - Logger instance
 * @returns Express router with QR code routes
 *
 * @example
 * ```typescript
 * const qrRoutes = createQrCodeRoutes(db, logger);
 * app.use('/api/qr', qrRoutes);
 * ```
 */
export function createQrCodeRoutes(logger: ILogger): Router {
  const router = Router();
  const controller = new QrCodeController(logger);

  /**
   * GET /api/qr/:partyId
   *
   * Generates and serves QR code PNG for party invitation
   *
   * @param partyId - Party unique identifier
   * @returns PNG image (image/png)
   *
   * @example
   * ```bash
   * curl https://api.example.com/api/qr/clxy7z8k00001 -o qr.png
   * ```
   */
  router.get('/:partyId', (req, res) => controller.generatePartyQR(req, res));

  return router;
}

import { Request, Response } from 'express';
import { generateWhatsAppJoinQR } from '@phone-games/notifications';
import { ILogger } from '@phone-games/logger';

/**
 * QR Code Controller
 *
 * Handles generation and serving of QR codes for party invitations.
 * QR codes encode WhatsApp links that pre-fill join messages.
 *
 * @example
 * ```typescript
 * // GET /api/qr?partyId=clxy7z8k00001&phoneNumber=+1234567890
 * // Returns PNG image that when scanned opens WhatsApp with:
 * // "JOIN_PARTY clxy7z8k00001" message ready to send
 * ```
 */
export class QrCodeController {
  private logger: ILogger;
  private twilioPhoneNumber: string;

  /**
   * Creates a new QR code controller
   *
   * @param db - Database client for party validation
   * @param logger - Logger instance for structured logging
   */
  constructor(logger: ILogger, twilioPhoneNumber: string) {
    this.logger = logger.child({ controller: 'QrCodeController' });
    this.twilioPhoneNumber = twilioPhoneNumber;
  }

  /**
   * Generates and serves QR code for party invitation
   *
   * GET /api/qr?partyId=<partyId>&phoneNumber=<phoneNumber>
   *
   * Validates party exists, then generates a QR code that encodes a WhatsApp
   * link with pre-filled "JOIN_PARTY <partyId>" message.
   *
   * @param req - Express request with partyId and phoneNumber query params
   * @param res - Express response
   *
   * @returns PNG image (image/png) with 1-hour cache
   *
   * @throws 400 if partyId or phoneNumber not provided or if TWILIO_PHONE_NUMBER not configured
   * @throws 404 if party not found
   * @throws 500 if QR generation fails
   *
   * @example
   * ```typescript
   * // Request
   * GET /api/qr?partyId=clxy7z8k00001&phoneNumber=+1234567890
   *
   * // Response
   * Content-Type: image/png
   * Cache-Control: public, max-age=3600
   * <PNG binary data>
   * ```
   */
  async generatePartyQR(req: Request, res: Response): Promise<void> {
    const { partyId } = req.params;

    // Validate partyId exists and is a non-empty string
    if (!partyId || typeof partyId !== 'string' || partyId.trim() === '') {
      this.logger.warn('Invalid or missing partyId', { params: req.params });
      res.status(400).json({
        success: false,
        error: 'partyId is required and must be a non-empty string',
      });
      return;
    }

    try {
      this.logger.info('Generating QR code for party', { partyId, phoneNumber: this.twilioPhoneNumber });

      // Generate QR code
      const qrBuffer = await generateWhatsAppJoinQR(this.twilioPhoneNumber, partyId);

      this.logger.info('QR code generated successfully', { partyId });

      // Set response headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache

      // Send PNG buffer
      res.send(qrBuffer);
    } catch (error) {
      this.logger.error('Failed to generate QR code', error instanceof Error ? error : new Error(String(error)));

      res.status(500).json({
        success: false,
        error: 'Failed to generate QR code',
      });
    }
  }
}

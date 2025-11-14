import QRCode from 'qrcode';

/**
 * Generates QR codes for party invitation via WhatsApp
 *
 * Creates QR codes that encode WhatsApp links with pre-filled messages
 * for joining game parties. When scanned, opens WhatsApp with a message
 * ready to send to the bot.
 *
 * @example
 * ```typescript
 * const buffer = await generateWhatsAppJoinQR('+14155238886', 'party123');
 * // QR encodes: https://wa.me/14155238886?text=JOIN_PARTY%20party123
 * ```
 */

/**
 * Generates a QR code PNG buffer for WhatsApp party join
 *
 * Creates a QR code that encodes a WhatsApp link (wa.me) with a pre-filled
 * "JOIN_PARTY <partyId>" message. When scanned, the QR code opens WhatsApp
 * with the message ready to send to the specified phone number.
 *
 * @param phoneNumber - WhatsApp bot phone number (format: +14155238886)
 * @param partyId - Unique party identifier (CUID)
 * @returns Promise resolving to PNG image buffer
 *
 * @throws {Error} If QR code generation fails
 *
 * @example
 * ```typescript
 * // Generate QR for party invitation
 * const qrBuffer = await generateWhatsAppJoinQR('+14155238886', 'clxy7z8k00001');
 *
 * // The QR encodes: https://wa.me/14155238886?text=JOIN_PARTY%20clxy7z8k00001
 * // When scanned, opens WhatsApp with "JOIN_PARTY clxy7z8k00001" ready to send
 * ```
 *
 * @remarks
 * - Phone number must include country code with + prefix
 * - WhatsApp link (wa.me) requires number without + prefix
 * - Message is URL-encoded in the link
 * - QR code generated as PNG with 400x400 pixel size
 * - Uses high error correction level (H) for reliability
 */
export async function generateWhatsAppJoinQR(
  phoneNumber: string,
  partyId: string
): Promise<Buffer> {
  // Remove + prefix for wa.me URL format
  const cleanNumber = phoneNumber.replace(/^\+/, '');

  // Construct WhatsApp link with pre-filled JOIN_PARTY message
  const message = `/join_party ${partyId}`;
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  try {
    // Generate QR code as PNG buffer
    const buffer = await QRCode.toBuffer(whatsappUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
    });

    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a QR code generator factory function
 *
 * Returns a configured generator function bound to a specific phone number.
 * Useful for creating multiple QR codes for different parties using the
 * same bot phone number.
 *
 * @param phoneNumber - WhatsApp bot phone number
 * @returns Function that generates QR codes for party IDs
 *
 * @example
 * ```typescript
 * const generateQR = createQRGenerator('+14155238886');
 *
 * const qr1 = await generateQR('party1');
 * const qr2 = await generateQR('party2');
 * ```
 */
export function createQRGenerator(phoneNumber: string) {
  return (partyId: string) => generateWhatsAppJoinQR(phoneNumber, partyId);
}

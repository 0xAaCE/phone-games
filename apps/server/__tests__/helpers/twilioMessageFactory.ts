import { TwilioIncomingMessage } from '@phone-games/messaging';

/**
 * Factory for creating Twilio webhook message payloads for testing
 */
export class TwilioMessageFactory {
  private static messageIdCounter = 1;

  /**
   * Create a Twilio WhatsApp incoming message payload
   *
   * @param from - Phone number (will be prefixed with whatsapp:)
   * @param body - Message text content
   * @param profileName - WhatsApp profile name
   * @returns Twilio webhook payload
   */
  static createMessage(
    from: string,
    body: string,
    profileName: string
  ): TwilioIncomingMessage {
    const messageId = `SM${this.messageIdCounter.toString().padStart(32, '0')}`;
    this.messageIdCounter++;

    return {
      MessageSid: messageId,
      AccountSid: 'AC' + '0'.repeat(32),
      From: `whatsapp:${from}`,
      To: 'whatsapp:+11234567890', // Our test Twilio number
      Body: body,
      NumMedia: '0',
      ProfileName: profileName,
      WaId: from.replace('+', ''),
      ApiVersion: '2010-04-01',
    };
  }

  /**
   * Reset the message ID counter (useful between tests)
   */
  static reset(): void {
    this.messageIdCounter = 1;
  }
}

/**
 * Test user data for consistent player identities
 */
export const TEST_USERS = {
  alice: {
    phoneNumber: '+11111111111',
    name: 'Alice',
  },
  bob: {
    phoneNumber: '+12222222222',
    name: 'Bob',
  },
  charlie: {
    phoneNumber: '+13333333333',
    name: 'Charlie',
  },
  // Spanish-speaking test users (Mexican phone numbers)
  diana: {
    phoneNumber: '+525511111111',
    name: 'Diana',
  },
  elena: {
    phoneNumber: '+525522222222',
    name: 'Elena',
  },
  fernando: {
    phoneNumber: '+525533333333',
    name: 'Fernando',
  },
} as const;

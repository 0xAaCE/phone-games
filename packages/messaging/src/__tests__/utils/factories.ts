import { TwilioIncomingMessage } from '../../interfaces/parsers/twilio.js';
import { WhatsAppIncomingMessage } from '../../interfaces/parsers/whatsapp.js';
import { User } from '@phone-games/db';

export class TestDataBuilder {
  static createTwilioMessage(overrides?: Partial<TwilioIncomingMessage>): TwilioIncomingMessage {
    return {
      MessageSid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      From: 'whatsapp:+1234567890',
      To: 'whatsapp:+14155238886',
      Body: '/create_party impostor TestParty',
      ProfileName: 'Test User',
      WaId: '1234567890',
      SmsMessageSid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      NumMedia: '0',
      MessageType: 'text',
      SmsSid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      SmsStatus: 'received',
      NumSegments: '1',
      ReferralNumMedia: '0',
      ApiVersion: '2010-04-01',
      ChannelMetadata: '{}',
      ...overrides,
    };
  }

  static createWhatsAppMessage(overrides?: Partial<WhatsAppIncomingMessage>): WhatsAppIncomingMessage {
    return {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15551234567',
                  phone_number_id: 'PHONE_NUMBER_ID',
                },
                contacts: [
                  {
                    profile: {
                      name: 'Test User',
                    },
                    wa_id: '1234567890',
                  },
                ],
                messages: [
                  {
                    from: '1234567890',
                    id: 'wamid.xxxxxxxxxxxxxxxxxxxxx',
                    timestamp: '1234567890',
                    text: {
                      body: '/create_party impostor TestParty',
                    },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
      ...overrides,
    };
  }

  static createUser(overrides?: Partial<User>): User {
    return {
      id: 'test-user-id',
      username: 'testuser',
      phoneNumber: '1234567890',
      firebaseUid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as User;
  }
}

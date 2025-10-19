import { describe, it, expect, beforeEach } from 'vitest';
import { TwilioParser } from '../../src/parsers/twilio';
import { MessagePlatform } from '../../src/interfaces/parsers';
import { TestDataBuilder } from '../utils/factories';

describe('TwilioParser', () => {
  let parser: TwilioParser;

  beforeEach(() => {
    parser = new TwilioParser();
  });

  describe('getMessagePlatform', () => {
    it('should return TWILIO platform', () => {
      expect(parser.getMessagePlatform()).toBe(MessagePlatform.TWILIO);
    });
  });

  describe('parse', () => {
    it('should extract text and user from Twilio message', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/create_party impostor MyParty',
        From: 'whatsapp:+5491158485048',
        WaId: '5491158485048',
        ProfileName: 'Ale',
      });

      const result = await parser.parse(message);

      // Parser only extracts text and user - commands handle action matching
      expect(result.text).toBe('/create_party impostor MyParty');
      expect(result.user).toMatchObject({
        username: 'Ale',
        phoneNumber: '5491158485048',
      });
      expect(result.user.id).toBeDefined();
    });

    it('should extract text from different message types', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/join_party party-id-123',
        From: 'whatsapp:+1234567890',
        WaId: '1234567890',
      });

      const result = await parser.parse(message);

      expect(result.text).toBe('/join_party party-id-123');
      expect(result.user.phoneNumber).toBe('1234567890');
    });

    it('should handle messages without ProfileName', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/leave_party',
        From: 'whatsapp:+1234567890',
        WaId: '1234567890',
        ProfileName: undefined,
      });

      const result = await parser.parse(message);

      expect(result.text).toBe('/leave_party');
      // Should use phone number as username when ProfileName is missing
      expect(result.user.username).toBe('1234567890');
    });
  });

  describe('phone number extraction', () => {
    it('should correctly extract phone number from whatsapp: prefix', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/test',
        From: 'whatsapp:+5491158485048',
        WaId: '5491158485048',
      });

      const result = await parser.parse(message);

      expect(result.user.phoneNumber).toBe('5491158485048');
    });

    it('should use WaId when available', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/test',
        From: 'whatsapp:+1111111111',
        WaId: '5491158485048',
      });

      const result = await parser.parse(message);

      // Should prefer WaId over extracted From
      expect(result.user.phoneNumber).toBe('5491158485048');
    });

    it('should handle missing WaId', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/test',
        From: 'whatsapp:+5491158485048',
        WaId: undefined,
      });

      const result = await parser.parse(message);

      expect(result.user.phoneNumber).toBe('5491158485048');
    });
  });
});

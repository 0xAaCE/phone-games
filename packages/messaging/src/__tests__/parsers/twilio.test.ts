import { describe, it, expect, beforeEach } from 'vitest';
import { TwilioParser } from '../../parsers/twilio.js';
import { ValidActions } from '../../interfaces/parsers/index.js';
import { TestDataBuilder } from '../utils/factories.js';
import { MockUserService } from '../utils/mocks.js';

describe('TwilioParser', () => {
  let parser: TwilioParser;
  let mockUserService: ReturnType<typeof MockUserService.create>;

  beforeEach(() => {
    mockUserService = MockUserService.create();
    parser = new TwilioParser(mockUserService);
  });

  describe('getMessagePlatform', () => {
    it('should return TWILIO platform', () => {
      expect(parser.getMessagePlatform()).toBe('twilio');
    });
  });

  describe('parse', () => {
    it('should parse create_party message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/create_party impostor MyParty',
        From: 'whatsapp:+5491158485048',
        WaId: '5491158485048',
        ProfileName: 'Ale',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.CREATE_PARTY);
      expect(result.user).toMatchObject({
        username: 'Ale',
        phoneNumber: '5491158485048',
      });
      expect(result.dataOutput).toMatchObject({
        gameName: 'impostor',
        partyName: 'MyParty',
      });
    });

    it('should parse join_party message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/join_party party-id-123',
        From: 'whatsapp:+1234567890',
        WaId: '1234567890',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.JOIN_PARTY);
      expect(result.dataOutput).toMatchObject({
        partyId: 'party-id-123',
      });
    });

    it('should parse leave_party message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/leave_party',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.LEAVE_PARTY);
      expect(result.dataOutput).toEqual({});
    });

    it('should parse start_match message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/start_match',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.START_MATCH);
      expect(result.dataOutput).toEqual({});
    });

    it('should parse next_round message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/next_round',
        From: 'whatsapp:+5491158485048',
        WaId: '5491158485048',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.NEXT_ROUND);
      expect(result.dataOutput).toHaveProperty('userId');
    });

    it('should parse vote/middle_round_action message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/vote targetuser',
        From: 'whatsapp:+5491158485048',
        WaId: '5491158485048',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.MIDDLE_ROUND_ACTION);
      expect(result.dataOutput).toHaveProperty('votes');
      expect(mockUserService.getUserByUsername).toHaveBeenCalledWith('targetuser');
    });

    it('should parse finish_round message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/finish_round',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.FINISH_ROUND);
      expect(result.dataOutput).toEqual({});
    });

    it('should parse finish_match message correctly', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/finish_match',
      });

      const result = await parser.parse(message);

      expect(result.action).toBe(ValidActions.FINISH_MATCH);
      expect(result.dataOutput).toEqual({});
    });

    it('should throw error for unknown action', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/unknown_action',
      });

      await expect(parser.parse(message)).rejects.toThrow('Unknown action in message');
    });
  });

  describe('phone number extraction', () => {
    it('should correctly extract phone number from whatsapp: prefix', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/leave_party',
        From: 'whatsapp:+5491158485048',
        WaId: '5491158485048',
        ProfileName: 'TestUser',
      });

      const result = await parser.parse(message);

      expect(result.user.phoneNumber).toBe('5491158485048');
    });

    it('should use WaId when available', async () => {
      const message = TestDataBuilder.createTwilioMessage({
        Body: '/leave_party',
        From: 'whatsapp:+1111111111',
        WaId: '5491158485048',
      });

      const result = await parser.parse(message);

      // waIdToUserId uses WaId, so the user should be based on WaId
      expect(result.user.phoneNumber).toBe('1111111111');
    });
  });
});

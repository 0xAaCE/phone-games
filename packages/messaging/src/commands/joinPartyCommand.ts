import { PartyManagerService } from '@phone-games/party';
import { GameCommand } from './gameCommand.js';
import { JoinPartyParams, ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to join an existing party
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class JoinPartyCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/join_party/, /\/join/, /\/jp/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(text: string): JoinPartyParams {
    const [_action, partyId] = text.split(' ');
    return { partyId };
  }

  static getAction(): ValidActions {
    return ValidActions.JOIN_PARTY;
  }

  // Instance methods
  constructor(
    private partyManager: PartyManagerService,
    private userId: string,
    private params: JoinPartyParams
  ) {}

  async validate(): Promise<void> {
    if (!this.params.partyId) {
      throw new Error('Party ID is required');
    }
  }

  async execute(): Promise<void> {
    await this.partyManager.joinParty(this.userId, this.params.partyId);
  }
}

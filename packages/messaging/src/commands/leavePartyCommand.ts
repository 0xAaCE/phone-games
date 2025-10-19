import { PartyManagerService } from '@phone-games/party';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to leave the current party
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class LeavePartyCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/leave_party/, /\/leave/, /\/lp/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(_text: string): Record<string, never> {
    return {};
  }

  static getAction(): ValidActions {
    return ValidActions.LEAVE_PARTY;
  }

  // Instance methods
  constructor(
    private partyManager: PartyManagerService,
    private userId: string
  ) {}

  async execute(): Promise<void> {
    await this.partyManager.leaveParty(this.userId);
  }
}

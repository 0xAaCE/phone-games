import { PartyManagerService } from '@phone-games/party';
import { FinishRoundParams, ValidGameNames } from '@phone-games/games';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to finish the current round
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class FinishRoundCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/finish_round/, /\/end_round/, /\/fr/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(_text: string): FinishRoundParams<ValidGameNames> {
    return {};
  }

  static getAction(): ValidActions {
    return ValidActions.FINISH_ROUND;
  }

  // Instance methods
  constructor(
    private partyManager: PartyManagerService,
    private userId: string,
    private params: FinishRoundParams<ValidGameNames>
  ) {}

  async execute(): Promise<void> {
    await this.partyManager.finishRound(this.userId, this.params);
  }
}

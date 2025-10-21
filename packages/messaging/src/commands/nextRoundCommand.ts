import { SessionCoordinator } from '@phone-games/party';
import { NextRoundParams, ValidGameNames } from '@phone-games/games';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to advance to the next round
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class NextRoundCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/next_round/, /\/next/, /\/nr/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(_text: string, userId: string): NextRoundParams<ValidGameNames> {
    // NextRoundParams just needs the userId
    return { userId };
  }

  static getAction(): ValidActions {
    return ValidActions.NEXT_ROUND;
  }

  // Instance methods
  constructor(
    private sessionCoordinator: SessionCoordinator,
    private userId: string,
    private params: NextRoundParams<ValidGameNames>
  ) {}

  async execute(): Promise<void> {
    await this.sessionCoordinator.nextRound(this.userId, this.params);
  }
}

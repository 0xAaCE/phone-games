import { SessionCoordinator } from '@phone-games/party';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to finish the match
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class FinishMatchCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/finish_match/, /\/end_match/, /\/fm/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(_text: string): Record<string, never> {
    return {};
  }

  static getAction(): ValidActions {
    return ValidActions.FINISH_MATCH;
  }

  // Instance methods
  constructor(
    private sessionCoordinator: SessionCoordinator,
    private userId: string
  ) {}

  async execute(): Promise<void> {
    await this.sessionCoordinator.finishMatch(this.userId);
  }
}

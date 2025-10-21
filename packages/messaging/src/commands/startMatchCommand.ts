import { SessionCoordinator } from '@phone-games/party';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to start the match
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class StartMatchCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/start_match/, /\/start/, /\/sm/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(_text: string): Record<string, never> {
    return {};
  }

  static getAction(): ValidActions {
    return ValidActions.START_MATCH;
  }

  // Instance methods
  constructor(
    private sessionCoordinator: SessionCoordinator,
    private userId: string
  ) {}

  async execute(): Promise<void> {
    await this.sessionCoordinator.startMatch(this.userId);
  }
}

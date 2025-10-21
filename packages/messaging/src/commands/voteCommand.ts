import { PartyManagerService } from '@phone-games/party';
import { MiddleRoundActionParams, ValidGameNames } from '@phone-games/games';
import { UserService } from '@phone-games/user';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command for middle round actions (voting, etc.)
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 *
 * This is a generic command that can handle various middle round actions.
 * In the future, you can create specific commands like:
 * - VoteImpostorCommand
 * - VoteInnocentCommand
 * - AccusePlayerCommand
 * - DefendPlayerCommand
 */
export class VoteCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  // Pattern captures: group 1 = vote command (vote|v), group 2 = username
  static readonly patterns = [/^\/(vote|v)\s+(\S+)/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static async parseParams(
    text: string,
    context?: { userId: string; userService: UserService }
  ): Promise<MiddleRoundActionParams<ValidGameNames>> {
    if (!context) {
      throw new Error('Context with userId and userService required');
    }

    // Extract username after the /vote command using this.patterns
    const match = text.match(this.patterns[0]);
    if (!match) {
      throw new Error('Invalid vote format. Expected: /vote username');
    }

    const vote = match[2].trim();
    const user = await context.userService.getUserByUsername(vote);

    if (!user) {
      throw new Error('User not found');
    }

    return { votes: { [context.userId]: user.id } };
  }

  static getAction(): ValidActions {
    return ValidActions.MIDDLE_ROUND_ACTION;
  }

  // Instance methods
  constructor(
    private partyManager: PartyManagerService,
    private userId: string,
    private params: MiddleRoundActionParams<ValidGameNames>
  ) {}

  async validate(): Promise<void> {
    if (!this.params.votes) {
      throw new Error('Vote data is required');
    }
  }

  async execute(): Promise<void> {
    await this.partyManager.middleRoundAction(this.userId, this.params);
  }
}

import { SessionCoordinator } from '@phone-games/party';
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
  /**
   * Regex patterns that match this command
   * Pattern captures: group 1 = vote command (vote|v), group 2 = username
   *
   * @example
   * "/vote username" - Full command
   * "/v username" - Short alias
   */
  static readonly patterns = [/^\/(vote|v)\s+(\S+)/];

  /**
   * Check if this command can handle the given message text
   *
   * @param text - The message text to check
   * @returns true if this command matches the text
   *
   * @example
   * VoteCommand.canHandle("/vote alice") // true
   * VoteCommand.canHandle("/v bob") // true
   * VoteCommand.canHandle("/start") // false
   */
  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  /**
   * Parse parameters from the message text
   * Extracts the username from the vote command and looks up the user
   *
   * @param text - The message text to parse (format: "/vote username")
   * @param context - Required context containing userId and userService
   * @returns The parsed vote parameters with user ID mapping
   * @throws {Error} If context is not provided
   * @throws {Error} If vote format is invalid
   * @throws {Error} If user is not found
   *
   * @example
   * await VoteCommand.parseParams("/vote alice", { userId: "123", userService })
   * // Returns: { votes: { "123": "alice-user-id" } }
   */
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

  /**
   * Get the ValidActions enum value for this command
   *
   * @returns The MIDDLE_ROUND_ACTION action enum value
   */
  static getAction(): ValidActions {
    return ValidActions.MIDDLE_ROUND_ACTION;
  }

  /**
   * Creates a new VoteCommand instance
   *
   * @param sessionCoordinator - Service for coordinating game sessions and party operations
   * @param userId - ID of the user executing the vote
   * @param params - Vote parameters containing the vote mapping
   */
  constructor(
    private sessionCoordinator: SessionCoordinator,
    private userId: string,
    private params: MiddleRoundActionParams<ValidGameNames>
  ) {}

  /**
   * Validate the command before execution
   * Ensures vote data is present
   *
   * @throws {Error} If vote data is missing
   */
  async validate(): Promise<void> {
    if (!this.params.votes) {
      throw new Error('Vote data is required');
    }
  }

  /**
   * Execute the vote command
   * Submits the vote to the session coordinator for processing
   *
   * @throws May throw errors from sessionCoordinator.middleRoundAction
   */
  async execute(): Promise<void> {
    await this.sessionCoordinator.middleRoundAction(this.userId, this.params);
  }
}

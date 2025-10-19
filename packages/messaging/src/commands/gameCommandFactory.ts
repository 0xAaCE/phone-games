import { PartyManagerService } from '@phone-games/party';
import { UserService } from '@phone-games/user';
import { GameCommand, GameCommandClass } from './gameCommand.js';
import { CreatePartyCommand } from './createPartyCommand.js';
import { JoinPartyCommand } from './joinPartyCommand.js';
import { LeavePartyCommand } from './leavePartyCommand.js';
import { StartMatchCommand } from './startMatchCommand.js';
import { NextRoundCommand } from './nextRoundCommand.js';
import { MiddleRoundActionCommand } from './middleRoundActionCommand.js';
import { FinishRoundCommand } from './finishRoundCommand.js';
import { FinishMatchCommand } from './finishMatchCommand.js';

/**
 * Factory for creating game commands
 *
 * Uses Chain of Responsibility pattern to find the matching command.
 * Each command is self-contained with its own regex and param parsing.
 *
 * Benefits:
 * - Adding new commands doesn't require modifying this factory
 * - Commands are registered in one place
 * - Commands handle their own matching and parsing
 */
export class GameCommandFactory {
  /**
   * Registry of all available commands
   * To add a new command, just add it to this array
   */
  private static readonly commandClasses: GameCommandClass[] = [
    CreatePartyCommand,
    JoinPartyCommand,
    LeavePartyCommand,
    StartMatchCommand,
    NextRoundCommand,
    MiddleRoundActionCommand,
    FinishRoundCommand,
    FinishMatchCommand,
  ];

  constructor(
    private partyManager: PartyManagerService,
    private userService: UserService
  ) {}

  /**
   * Create a command from message text
   *
   * Iterates through registered commands to find one that matches the text,
   * then uses that command's parseParams method to extract parameters.
   *
   * @param text - The message text
   * @param userId - The user ID
   * @returns A GameCommand ready to execute
   * @throws Error if no command matches the text
   */
  async createCommand(text: string, userId: string): Promise<GameCommand> {
    // Find the command class that can handle this text
    for (const CommandClass of GameCommandFactory.commandClasses) {
      if (CommandClass.canHandle(text)) {
        // Parse params using the command's static method
        // Some commands need context (userId, userService)
        const context = { userId, userService: this.userService };
        const params = await CommandClass.parseParams(text, context);

        // Instantiate and return the command
        return new CommandClass(this.partyManager, userId, params) as GameCommand;
      }
    }

    throw new Error(`Unknown command: ${text}`);
  }

  /**
   * Get all registered command classes (useful for documentation/help)
   */
  static getAllCommandClasses(): GameCommandClass[] {
    return this.commandClasses;
  }
}

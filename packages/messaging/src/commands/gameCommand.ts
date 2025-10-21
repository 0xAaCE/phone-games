import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command Pattern - Interface for game action instances
 *
 * Each game action (create party, join party, vote, etc.) is encapsulated
 * as a command object that can be executed independently.
 */
export interface GameCommand {
  /**
   * Execute the command
   */
  execute(): Promise<void>;

  /**
   * Optional: Validate the command before execution
   * Throws error if invalid
   */
  validate?(): Promise<void>;

  /**
   * Optional: Undo the command (for future implementation)
   */
  undo?(): Promise<void>;
}

/**
 * Interface for GameCommand class (static methods)
 *
 * Each command class must implement these static methods to be self-contained:
 * - canHandle: Determines if this command matches the message text
 * - parseParams: Extracts parameters from the message text
 * - getAction: Returns the ValidActions enum value for type safety
 *
 * Benefits:
 * - Commands are completely self-contained (regex, parsing, execution)
 * - No duplication of actionPatterns or parseParams across parsers
 * - Adding new actions doesn't require modifying parsers or factory
 * - Follows Open/Closed Principle
 */
export interface GameCommandClass<TParams = any> {
  /**
   * Regex patterns that match this command
   * Can include multiple patterns for aliases (e.g., /\/vote/, /\/v/)
   */
  readonly patterns: RegExp[];

  /**
   * Check if this command can handle the given message text
   * @param text - The message text to check
   * @returns true if this command matches the text
   */
  canHandle(text: string): boolean;

  /**
   * Parse parameters from the message text
   * @param text - The message text to parse
   * @param context - Optional context (userId, userService, etc.)
   * @returns The parsed parameters for this command
   */
  parseParams(text: string, context?: any): TParams | Promise<TParams>;

  /**
   * Get the ValidActions enum value for this command
   * @returns The action enum value
   */
  getAction(): ValidActions;

  /**
   * Constructor signature
   */
  new (...args: any[]): GameCommand;
}

import { PartyManagerService } from '@phone-games/party';
import { GameFactory, ValidGameNames } from '@phone-games/games';
import { GameCommand } from './gameCommand.js';
import { CreatePartyParams, ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to create a new party
 * Self-contained: owns its regex patterns, param parsing, and execution logic
 */
export class CreatePartyCommand implements GameCommand {
  // Static properties and methods for matching and parsing
  static readonly patterns = [/\/create_party/, /\/new_party/, /\/cp/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(text: string): CreatePartyParams {
    const [_action, gameName, partyName] = text.split(' ');
    return {
      gameName: gameName as ValidGameNames,
      partyName,
    };
  }

  static getAction(): ValidActions {
    return ValidActions.CREATE_PARTY;
  }

  // Instance methods
  constructor(
    private partyManager: PartyManagerService,
    private userId: string,
    private params: CreatePartyParams
  ) {}

  async validate(): Promise<boolean> {
    if (!this.params.gameName || !this.params.partyName) {
      throw new Error('Game name and party name are required');
    }
    return true;
  }

  async execute(): Promise<void> {
    const game = GameFactory.createGame(this.params.gameName);
    await this.partyManager.createParty(this.userId, this.params.partyName, game);
  }
}

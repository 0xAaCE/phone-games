import { NotificationService } from '@phone-games/notifications';
import { GameCommand } from './gameCommand.js';
import { ValidActions } from '../interfaces/parsers/index.js';

/**
 * Command to show the help message
 * Does not interact with SessionCoordinator — sends directly via NotificationService
 */
export class HelpCommand implements GameCommand {
  static readonly patterns = [/^\/help$/, /^\/h$/];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(): Record<string, never> {
    return {};
  }

  static getAction(): ValidActions {
    // help is not in ValidActions enum; cast to satisfy GameCommandClass interface
    return 'help' as unknown as ValidActions;
  }

  constructor(
    private notificationService: NotificationService,
    private userId: string
  ) {}

  async execute(): Promise<void> {
    await this.notificationService.notifyHelp(this.userId);
  }
}

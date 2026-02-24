import {
  ITemplateRegistry,
  GetTemplateParams,
  CreateTemplateParams,
  ShouldUseTemplateParams,
  Template,
  TemplateDependencies,
  TemplateRegistry,
} from '@phone-games/notifications';

/**
 * Mock template registry for testing.
 * Returns fake SIDs instead of making real Twilio API calls.
 */
export class MockTwilioTemplateRegistry implements ITemplateRegistry {
  getPlatform(): string {
    return 'twilio';
  }

  registerTemplate(_params: GetTemplateParams, _sid: string): void {
    // no-op
  }

  shouldUseTemplate(_params: ShouldUseTemplateParams): boolean {
    return true;
  }

  async getTemplate(_params: GetTemplateParams, _dependencies: TemplateDependencies): Promise<Template> {
    return { sid: 'test-template-sid' };
  }

  async createTemplate(_params: CreateTemplateParams, _dependencies: TemplateDependencies): Promise<Template> {
    return { sid: 'test-created-sid' };
  }
}

/**
 * Creates a TemplateRegistry backed by a mock Twilio implementation.
 * Uses the real TemplateRegistry composite class with a mock inner registry.
 */
export function createMockTemplateRegistry(): TemplateRegistry {
  return new TemplateRegistry([new MockTwilioTemplateRegistry()]);
}

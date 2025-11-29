import { GameState, ValidGameNames } from '@phone-games/games';

import { Translator, ValidGameActions } from '../internal.js';

export type TwilioTemplate = { sid: string, contentVariables?: string }; // allow pure sid reference

export type Template = TwilioTemplate;

export type GetTemplateParams = {
  language: string;
  action: ValidGameActions;
  platform: string;
  gameState: GameState<ValidGameNames>;
}

export type TemplateDependencies = {
  translator: Translator;
}
export interface ITemplateRegistry {
  getPlatform: () => string;
  registerTemplate: (params: GetTemplateParams, sid: string) => void;
  getTemplate: (params: GetTemplateParams, dependencies: TemplateDependencies) => Promise<Template>
}
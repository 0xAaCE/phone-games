import { PartyParams, Translator, ValidGameActions, ValidPartyActions } from '../internal.js';
import { GameState, ValidGameNames } from '@phone-games/games';

export type TwilioTemplate = { sid: string, contentVariables?: string }; // allow pure sid reference

export type Template = TwilioTemplate;

export type ShouldUseTemplateParams = {
  language: string;
  action: ValidGameActions | ValidPartyActions;
  platform: string;
}

export type GetTemplateParams = {
  language: string;
  action: ValidGameActions | ValidPartyActions;
  platform: string;
  partyParams: PartyParams;
}

export type CreateTemplateParams = {
  language: string;
  action: ValidGameActions | ValidPartyActions;
  platform: string;
  partyParams: PartyParams;
  gameState?: GameState<ValidGameNames>;
}

export type TemplateDependencies = {
  translator: Translator;
}
export interface ITemplateRegistry {
  getPlatform: () => string;
  registerTemplate: (params: GetTemplateParams, sid: string) => void;
  shouldUseTemplate: (params: ShouldUseTemplateParams) => boolean;
  getTemplate: (params: GetTemplateParams, dependencies: TemplateDependencies) => Promise<Template>
  createTemplate: (params: CreateTemplateParams, dependencies: TemplateDependencies) => Promise<Template>
}
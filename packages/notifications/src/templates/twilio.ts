import twilio from "twilio";
import { ContentCreateRequest } from "twilio/lib/rest/content/v1/content";
import { ILogger } from "@phone-games/logger";

import { ValidGameActions, ITemplateRegistry, TwilioTemplate, GetTemplateParams, TemplateDependencies, ValidPartyActions, CreateTemplateParams, ShouldUseTemplateParams } from "../internal.js";
import { TwilioTemplateFactory } from "./twilio/index.js";
import { TwilioError } from "@phone-games/errors";

type Template = {
    [language: string]: {
        [action: string]: { sid: string }
    }
};

const templates: Template = {
    'default': {
        'create_party': {
            sid: 'HXb60dfd7818fe45d3c7efd385ac21ff3e',
        },
        'join_party': {
            sid: 'HXb60dfd7818fe45d3c7efd385ac21ff3e',
        },
        'start_match': {
            sid: 'HX3062bd2e3bc819e8c88a5d4dde0e8350',
        },
        'middle_round_action': {
            sid: 'HXac95b78f231949b12796a7193cc56fb3',
        },
        'finish_round': {
            sid: 'HX78d49d3c2e0df6b2d0c1ac06d4eef6d4',
        },
        'finish_match': {
            sid: 'HX04861466f98f7669eaf8f03ef4204e9b',
        },
    },
};

export class TwilioImpostorTemplateRegistry implements ITemplateRegistry {
    private templates: Template
    private client: twilio.Twilio;
    private logger: ILogger;

    constructor(accountSid: string, authToken: string, logger: ILogger) {
        this.client = twilio(accountSid, authToken);
        this.templates = templates;
        this.logger = logger;
    }

    getPlatform(): string {
        return 'twilio';
    }

    registerTemplate(params: GetTemplateParams, sid: string): void {
        if (!this.templates[params.language]) {
            this.templates[params.language] = {};
        }
        this.templates[params.language][this.getTemplateKey(params)] = { sid };
    }

    shouldUseTemplate(_params: ShouldUseTemplateParams): boolean {
        return true;
    }

    private createNextRoundTemplate(params: CreateTemplateParams, dependencies: TemplateDependencies): ContentCreateRequest {
        const template = TwilioTemplateFactory.buildListPicker('next_round').language(params.language).body(dependencies.translator.t('impostor.nextRound.body')).button(dependencies.translator.t('impostor.nextRound.button'));
        if (!params.gameState) {
            throw new Error('Game state is required for next round template');
        }
        
        params.gameState.players.forEach((player, index) => {
            template.addItem({ id: `index_${index}`, item: `/vote ${player.user.username}` });
        });

        return template.build();
    }

    private buildTemplate(params: GetTemplateParams, dependencies: TemplateDependencies): ContentCreateRequest {
        switch (params.action) {
            case ValidGameActions.NEXT_ROUND:
                return this.createNextRoundTemplate(params, dependencies);
            default:
                throw new Error(`Template not found for action: ${params.action}`);
        }
    }

    async createTemplate(params: CreateTemplateParams, dependencies: TemplateDependencies): Promise<TwilioTemplate> {
        const template = this.buildTemplate(params, dependencies);

        try {
            const result = await this.client.content.v1.contents.create(template);
            this.registerTemplate(params, result.sid);
            return result;
        } catch (error) {
            const formattedError = error instanceof Error ? error : new Error(String(error));
            this.logger.error('Failed to create template', formattedError);
            throw new TwilioError("Failed to create template", formattedError);
        }
    }

    private getTemplateKey(params: GetTemplateParams): string {
        switch (params.action) {
            case ValidPartyActions.CREATE_PARTY:
                return `create_party`;
            case ValidPartyActions.PLAYER_JOINED:
                return `join_party`;
            case ValidGameActions.START_MATCH:
                return `start_match`;
            case ValidGameActions.NEXT_ROUND:
                return `next_round-${params.partyParams.partyId}`;
            case ValidGameActions.MIDDLE_ROUND_ACTION:
                return `middle_round_action`;
            case ValidGameActions.FINISH_ROUND:
                return `finish_round`;
            case ValidGameActions.FINISH_MATCH:
                return `finish_match`;
            default:
                return params.action;
        }
    }

    async getTemplateByLanguage(params: GetTemplateParams): Promise<TwilioTemplate> {
        return this.templates[params.language]?.[this.getTemplateKey(params)] ?? this.templates['default'][this.getTemplateKey(params)];
    }

    async getTemplate(params: GetTemplateParams, _dependencies: TemplateDependencies): Promise<TwilioTemplate> {
        return await this.getTemplateByLanguage(params)
    }
}
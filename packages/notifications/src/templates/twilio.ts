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
            sid: 'HXb78977e5be831a27b15bc23cb8cc7375',
        },
        'join_party': {
            sid: 'HXb78977e5be831a27b15bc23cb8cc7375',
        },
        'start_match': {
            sid: 'HXcf348c4f53f04037991143596920b794',
        },
        'middle_round_action': {
            sid: 'HX06eb5d0833f6a40c9bc090bb6d166845',
        },
        'finish_round': {
            sid: 'HX37bf4173c587f52775b3d642c6849167',
        },
        'finish_match': {
            sid: 'HX5a73da8874f717d987f2895431c2e742',
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
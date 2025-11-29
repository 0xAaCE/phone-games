import twilio from "twilio";
import { ContentCreateRequest } from "twilio/lib/rest/content/v1/content";
import { ILogger } from "@phone-games/logger";

import { ValidGameActions, ITemplateRegistry, TwilioTemplate, GetTemplateParams, TemplateDependencies } from "../internal.js";
import { TwilioTemplateFactory } from "./twilio/index.js";
import { TwilioError } from "@phone-games/errors";

type Template = {
    [language: string]: {
        [action: string]: { sid: string }
    }
};

const templates: Template = {
    'es': {
        'next_round': {
            sid: 'HXa6a275bbbfa4e3fbb00898722d56004a',
        }
    }
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

    private createNextRoundTemplate(params: GetTemplateParams, dependencies: TemplateDependencies): ContentCreateRequest {
        const template = TwilioTemplateFactory.buildListPicker('next_round').language(params.language).body(dependencies.translator.t('impostor.nextRound.body')).button(dependencies.translator.t('impostor.nextRound.button'));
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

    private async createTemplate(params: GetTemplateParams, dependencies: TemplateDependencies): Promise<TwilioTemplate> {
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
            case ValidGameActions.NEXT_ROUND:
                return `next_round-${params.gameState.partyId}`;
            default:
                return params.action;
        }
    }

    async getTemplate(params: GetTemplateParams, dependencies: TemplateDependencies): Promise<TwilioTemplate> {
        return this.templates[params.language]?.[this.getTemplateKey(params)] ?? await this.createTemplate(params, dependencies);
    }
}
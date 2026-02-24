import { CreateTemplateParams, GetTemplateParams, ITemplateRegistry, ShouldUseTemplateParams, Template, TemplateDependencies } from "../internal.js";
export class TemplateRegistry implements ITemplateRegistry {
    private TemplateRegistries: Map<string, ITemplateRegistry> = new Map();

    constructor(registries: ITemplateRegistry[]) {
        registries.forEach(registry => {
            this.TemplateRegistries.set(registry.getPlatform(), registry);
        });
    }

    getPlatform(): string {
        return 'templates';
    }

    addRegistry(registry: ITemplateRegistry): void {
        this.TemplateRegistries.set(registry.getPlatform(), registry);
    }

    registerTemplate(params: GetTemplateParams, sid: string): void {
        const templateRegistry = this.TemplateRegistries.get(params.platform);
        if (!templateRegistry) {
            throw new Error(`Template registry for platform ${params.platform} not found`);
        }
        templateRegistry.registerTemplate(params, sid);
    }
    
    async getTemplate(params: GetTemplateParams, dependencies: TemplateDependencies): Promise<Template> {
        const templateRegistry = this.TemplateRegistries.get(params.platform);
        if (!templateRegistry) {
            throw new Error(`Template registry for platform ${params.platform} not found`);
        }
        return await templateRegistry.getTemplate(params, dependencies);
    }

    async createTemplate(params: CreateTemplateParams, dependencies: TemplateDependencies): Promise<Template> {
        const templateRegistry = this.TemplateRegistries.get(params.platform);
        if (!templateRegistry) {
            throw new Error(`Template registry for platform ${params.platform} not found`);
        }
        return await templateRegistry.createTemplate(params, dependencies);
    }

    shouldUseTemplate(params: ShouldUseTemplateParams): boolean {
        const templateRegistry = this.TemplateRegistries.get(params.platform);
        if (!templateRegistry) {
            return false;
        }
        return templateRegistry.shouldUseTemplate(params);
    }
}

export { TwilioImpostorTemplateRegistry } from './twilio.js';

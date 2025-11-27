import { getTemplate as getTwillioTemplate } from './twillio.js';

export const getTemplate = (platform: string, language: string, action: string): string | undefined => {
    switch (platform) {
        case 'twillio':
            return getTwillioTemplate(language, action);
        default:
            return undefined;
    }
};
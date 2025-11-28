import { getTemplate as getTwilioTemplate } from './twilio.js';

/**
 * Retrieves a notification template for the specified platform, language, and action.
 * 
 * @param platform - The platform identifier (e.g., 'twilio')
 * @param language - The language code for the template
 * @param action - The action identifier for the template
 * @returns The template string if found, otherwise undefined
 */
export const getTemplate = (platform: string, language: string, action: string): string | undefined => {
    switch (platform) {
        case 'twilio':
            return getTwilioTemplate(language, action);
        default:
            return undefined;
    }
};
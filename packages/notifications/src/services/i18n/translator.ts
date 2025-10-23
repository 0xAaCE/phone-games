import { en, type TranslationStructure } from './locales/en.js';
import { es } from './locales/es.js';
import { type SupportedLanguage, DEFAULT_LANGUAGE } from './languageDetector.js';

/**
 * Available translations
 */
const translations: Record<SupportedLanguage, TranslationStructure> = {
  en,
  es,
  pt: en, // Fallback to English for now
  fr: en, // Fallback to English for now
};

/**
 * Gets a nested value from an object using dot notation
 *
 * @param obj - Object to traverse
 * @param path - Dot-notated path (e.g., "party.created")
 * @returns Value at the path or undefined
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Replaces template variables in a string
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns String with variables replaced
 *
 * @example
 * ```typescript
 * replaceVariables("Hello {{name}}!", { name: "World" })
 * // Returns: "Hello World!"
 * ```
 */
function replaceVariables(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(variables[key] ?? `{{${key}}}`);
  });
}

/**
 * Translator class for managing translations
 *
 * @example
 * ```typescript
 * const t = new Translator('es');
 * const message = t.translate('party.created', {
 *   partyName: 'Friday Games',
 *   partyId: '123'
 * });
 * // Returns: "Partida "Friday Games" creada exitosamente! ID de partida: 123"
 * ```
 */
export class Translator {
  private language: SupportedLanguage;
  private translations: TranslationStructure;

  /**
   * Creates a new translator instance
   *
   * @param language - Language code to use for translations
   */
  constructor(language: SupportedLanguage = DEFAULT_LANGUAGE) {
    this.language = language;
    this.translations = translations[language] || translations[DEFAULT_LANGUAGE];
  }

  /**
   * Translates a key with optional variable substitution
   *
   * @param key - Translation key in dot notation (e.g., "party.created")
   * @param variables - Optional variables to substitute in the translation
   * @returns Translated string with variables replaced
   *
   * @example
   * ```typescript
   * t.translate('impostor.nextRound', { word: 'apple' })
   * // English: "The next round has started and your word is:\n\napple"
   * // Spanish: "La siguiente ronda ha comenzado y tu palabra es:\n\nmanzana"
   * ```
   */
  translate(key: string, variables?: Record<string, string | number>): string {
    const template = getNestedValue(this.translations, key);

    if (!template) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    if (!variables) {
      return template;
    }

    return replaceVariables(template, variables);
  }

  /**
   * Shorthand for translate method
   */
  t(key: string, variables?: Record<string, string | number>): string {
    return this.translate(key, variables);
  }

  /**
   * Gets the current language
   */
  getLanguage(): SupportedLanguage {
    return this.language;
  }

  /**
   * Changes the language
   */
  setLanguage(language: SupportedLanguage): void {
    this.language = language;
    this.translations = translations[language] || translations[DEFAULT_LANGUAGE];
  }
}

/**
 * Creates a translator instance for a specific language
 *
 * @param language - Language code
 * @returns New Translator instance
 *
 * @example
 * ```typescript
 * const t = createTranslator('es');
 * const message = t.translate('party.created', { partyName: 'Test', partyId: '123' });
 * ```
 */
export function createTranslator(language: SupportedLanguage = DEFAULT_LANGUAGE): Translator {
  return new Translator(language);
}

/**
 * Maps phone country codes to language codes
 * Based on the primary language spoken in each country
 */
const COUNTRY_CODE_TO_LANGUAGE: Record<string, string> = {
  // Spanish-speaking countries
  '34': 'es',   // Spain
  '52': 'es',   // Mexico
  '54': 'es',   // Argentina
  '56': 'es',   // Chile
  '57': 'es',   // Colombia
  '58': 'es',   // Venezuela
  '51': 'es',   // Peru
  '53': 'es',   // Cuba
  '591': 'es',  // Bolivia
  '593': 'es',  // Ecuador
  '595': 'es',  // Paraguay
  '598': 'es',  // Uruguay
  '502': 'es',  // Guatemala
  '503': 'es',  // El Salvador
  '504': 'es',  // Honduras
  '505': 'es',  // Nicaragua
  '506': 'es',  // Costa Rica
  '507': 'es',  // Panama
  '509': 'es',  // Haiti (also French/Creole)

  // English-speaking countries
  '1': 'en',    // USA, Canada, Caribbean
  '44': 'en',   // UK
  '61': 'en',   // Australia
  '64': 'en',   // New Zealand
  '27': 'en',   // South Africa
  '353': 'en',  // Ireland
  '91': 'en',   // India (English widely used)

  // Portuguese-speaking countries
  '55': 'pt',   // Brazil
  '351': 'pt',  // Portugal

  // French-speaking countries
  '33': 'fr',   // France
  '32': 'fr',   // Belgium (also Dutch)
  '41': 'fr',   // Switzerland (also German/Italian)
};

/**
 * Supported languages
 */
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr';

/**
 * Default language when detection fails or no phone number provided
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

/**
 * Detects language from a phone number's country code
 *
 * @param phoneNumber - Phone number in international format (e.g., "+525512345678")
 * @returns Detected language code or default language ('en')
 *
 * @example
 * ```typescript
 * detectLanguageFromPhone("+525512345678") // returns 'es' (Mexico)
 * detectLanguageFromPhone("+14155551234")  // returns 'en' (USA)
 * detectLanguageFromPhone("+34612345678")  // returns 'es' (Spain)
 * detectLanguageFromPhone(null)            // returns 'en' (default)
 * ```
 */
export function detectLanguageFromPhone(phoneNumber: string | null | undefined): SupportedLanguage {
  if (!phoneNumber) {
    return DEFAULT_LANGUAGE;
  }

  // Remove any non-digit characters and leading +
  const digits = phoneNumber.replace(/\D/g, '');

  // Try to match country codes (from longest to shortest)
  // This handles cases like 591 (Bolivia) vs 59 (not a valid code)
  const sortedCodes = Object.keys(COUNTRY_CODE_TO_LANGUAGE).sort((a, b) => b.length - a.length);

  for (const code of sortedCodes) {
    if (digits.startsWith(code)) {
      return COUNTRY_CODE_TO_LANGUAGE[code] as SupportedLanguage;
    }
  }

  // Default to English if no match found
  return DEFAULT_LANGUAGE;
}

/**
 * Checks if a language code is supported
 *
 * @param language - Language code to check
 * @returns True if language is supported
 */
export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return ['en', 'es', 'pt', 'fr'].includes(language);
}

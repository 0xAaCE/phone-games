import { WORD_LISTS, WordCategory, WordLanguage } from './wordLists.js';

/**
 * Configuration for word generation
 */
export interface WordGeneratorConfig {
  /** Language for word generation (default: 'en') */
  language?: WordLanguage;
  /** Specific categories to use (if not provided, uses all categories) */
  categories?: WordCategory[];
  /** Whether to avoid repeating words in the same session (default: true) */
  avoidRepeats?: boolean;
}

/**
 * WordGenerator service for Impostor game
 *
 * Generates random words from categorized lists with support for:
 * - Multiple languages (English, Spanish)
 * - Different categories (animals, food, places, etc.)
 * - Repeat prevention within a session
 * - Language-aware word selection
 *
 * @example
 * ```typescript
 * const generator = new WordGenerator({ language: 'es', categories: [WordCategory.ANIMALS] });
 * const word = generator.getRandomWord(); // Returns "elefante", "jirafa", etc.
 * ```
 */
export class WordGenerator {
  private language: WordLanguage;
  private categories: WordCategory[];
  private avoidRepeats: boolean;
  private usedWords: Set<string>;
  private availableWords: string[];

  /**
   * Creates a new WordGenerator instance
   *
   * @param config - Configuration for word generation
   *
   * @example
   * ```typescript
   * // English generator with all categories
   * const generator = new WordGenerator();
   *
   * // Spanish generator with specific categories
   * const spanishGen = new WordGenerator({
   *   language: 'es',
   *   categories: [WordCategory.FOOD, WordCategory.ANIMALS]
   * });
   * ```
   */
  constructor(config: WordGeneratorConfig = {}) {
    this.language = config.language || 'en';
    this.categories = config.categories || Object.values(WordCategory);
    this.avoidRepeats = config.avoidRepeats ?? true;
    this.usedWords = new Set();
    this.availableWords = this.buildWordList();
  }

  /**
   * Gets a random word from the available word pool
   *
   * If repeat avoidance is enabled, won't return the same word twice
   * until all words have been used (then resets).
   *
   * @returns A random word in the configured language
   *
   * @example
   * ```typescript
   * const word = generator.getRandomWord(); // "pizza"
   * const word2 = generator.getRandomWord(); // "ocean" (different from first)
   * ```
   */
  getRandomWord(): string {
    if (this.availableWords.length === 0) {
      throw new Error('No words available for the selected categories');
    }

    if (this.avoidRepeats && this.usedWords.size >= this.availableWords.length) {
      // All words have been used, reset
      this.resetUsedWords();
    }

    let word: string;
    do {
      word = this.availableWords[Math.floor(Math.random() * this.availableWords.length)];
    } while (this.avoidRepeats && this.usedWords.has(word));

    if (this.avoidRepeats) {
      this.usedWords.add(word);
    }

    return word;
  }

  /**
   * Gets multiple random words at once
   *
   * @param count - Number of words to generate
   * @returns Array of random words
   *
   * @example
   * ```typescript
   * const words = generator.getRandomWords(3); // ["pizza", "ocean", "guitar"]
   * ```
   */
  getRandomWords(count: number): string[] {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(this.getRandomWord());
    }
    return words;
  }

  /**
   * Resets the used words tracking
   * Allows all words to be used again
   *
   * @example
   * ```typescript
   * generator.resetUsedWords();
   * ```
   */
  resetUsedWords(): void {
    this.usedWords.clear();
  }

  /**
   * Gets the current language
   *
   * @returns Current language code
   */
  getLanguage(): WordLanguage {
    return this.language;
  }

  /**
   * Sets a new language and rebuilds word list
   *
   * @param language - New language to use
   *
   * @example
   * ```typescript
   * generator.setLanguage('es'); // Switch to Spanish
   * ```
   */
  setLanguage(language: WordLanguage): void {
    this.language = language;
    this.availableWords = this.buildWordList();
    this.resetUsedWords();
  }

  /**
   * Gets the active categories
   *
   * @returns Array of active word categories
   */
  getCategories(): WordCategory[] {
    return [...this.categories];
  }

  /**
   * Sets new categories and rebuilds word list
   *
   * @param categories - New categories to use
   *
   * @example
   * ```typescript
   * generator.setCategories([WordCategory.ANIMALS, WordCategory.FOOD]);
   * ```
   */
  setCategories(categories: WordCategory[]): void {
    this.categories = categories;
    this.availableWords = this.buildWordList();
    this.resetUsedWords();
  }

  /**
   * Gets the total number of available words
   *
   * @returns Total word count
   */
  getWordCount(): number {
    return this.availableWords.length;
  }

  /**
   * Gets the number of words used in current session
   *
   * @returns Used word count
   */
  getUsedWordCount(): number {
    return this.usedWords.size;
  }

  /**
   * Builds the word list from selected language and categories
   *
   * @private
   * @returns Flattened array of all words
   */
  private buildWordList(): string[] {
    const words: string[] = [];
    const languageWords = WORD_LISTS[this.language];

    for (const category of this.categories) {
      const categoryWords = languageWords[category];
      if (categoryWords) {
        words.push(...categoryWords);
      }
    }

    return words;
  }
}

/**
 * Creates a WordGenerator with default configuration
 *
 * @param config - Optional configuration
 * @returns New WordGenerator instance
 *
 * @example
 * ```typescript
 * const generator = createWordGenerator({ language: 'es' });
 * ```
 */
export function createWordGenerator(config?: WordGeneratorConfig): WordGenerator {
  return new WordGenerator(config);
}

/**
 * Re-export mock repositories for use in integration tests
 *
 * These mocks provide in-memory implementations of repository interfaces
 * for testing without needing a real database.
 */
export { MockUserRepository } from '@phone-games/repositories/__tests__/mocks/mockUserRepository.js';
export { MockPartyRepository } from '@phone-games/repositories/__tests__/mocks/mockPartyRepository.js';
